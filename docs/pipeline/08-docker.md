# 08 Docker

One service: nginx serving the static build. No backend, database, volumes or secrets (Step 4 decision).

## Files
| File | Purpose |
|---|---|
| `frontend/Dockerfile` | Two stages. `node:24.20.0-alpine` runs `npm ci` and the build; `nginx/nginx-unprivileged:1.31.7-alpine3.24` serves `dist`. Runs as the `nginx` user, listens on 8080, has a healthcheck. Build context is the repo root, because the frontend imports the engine workspace package. |
| `frontend/nginx.conf` | Security headers, `/health`, long cache for hashed assets, the three real routes with status 200, real 404 for everything else |
| `docker-compose.yml` | The `frontend` service, port `${FRONTEND_PORT:-8080}`, all capabilities dropped, `no-new-privileges` |
| `docker-compose.dev.yml` | Vite dev server with hot reload in a Node container, on `127.0.0.1:5173` |
| `.dockerignore` | Keeps `node_modules`, `dist`, docs, reports and any `.env` out of the image |
| `scripts/verify-docker.sh` | Builds, runs and checks the container (routes, headers, user, image contents, optional browser walkthrough) |
| `scripts/serve-nginx-stand-in.mjs`, `scripts/check-csp.mjs` | Stand-in for sandboxes without registry access (see below) |
| `scripts/gate-08.mjs` | The gate |

Run it: `docker compose up --build` then open http://localhost:8080. Development: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`.

## Headers sent on every response
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'`. `connect-src 'none'` means the page cannot make any network request, which is the technical backing for "your text never leaves the tab". `'unsafe-inline'` is for styles only, because Motion and Sonner set inline styles.
- `X-Robots-Tag: noindex, nofollow`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Permissions-Policy` with camera, microphone and geolocation off.

## Changes from the Step 4 plan (logged)
- **No `40-seo.sh` entrypoint script.** Step 4 planned one to write robots and headers at start-up, but nothing varies at runtime: the app is always noindex (the HTML itself carries `noindex`), so static config is simpler and cannot misfire. `ALLOW_INDEXING` stays in `.env.example` as `false` and is not read by the container.
- **Unknown URLs return a real 404** (with the app shell as the body so the app shows its own "not found" screen). Step 4 had planned a plain SPA fallback that answers 200 for everything. The three real routes (`/`, `/math-lab`, `/verify`) are listed explicitly in `nginx.conf`. If a route is added in the app, add it there too.
- **Image namespace is `nginx/nginx-unprivileged`**, not `nginxinc/...`. Docker Hub shows the `nginx` namespace as the maintained one with weekly rebuilds, and the old `nginxinc` page is marked archived.
- **Vite no longer inlines assets** (`assetsInlineLimit: 0`). With inlining on, a small font became a `data:` URI and the strict CSP blocked it. Now the CSP needs no `data:` source at all.
- Node pin is 24.20.0 (the base image tag in Step 4 said `node:24-alpine`).

## Verification
| Check | Status |
|---|---|
| `docker compose config -q` for both compose files | pass |
| `nginx.conf` rules and headers, read by the gate | pass |
| Full browser walkthrough (21 checks) plus axe (0 violations) against a stand-in server that applies the real headers from `nginx.conf`, with no console errors, so no CSP violations | pass. This run found the `data:` font problem above |
| Pull base images, build, run the container, `scripts/verify-docker.sh` | **not verified**. The sandbox's Docker daemon cannot reach the registry (blocked by the network allowlist) |
| `nginx -t` on `nginx.conf` | **not verified** for the same reason (no nginx binary here) |
| Exact tags `node:24.20.0-alpine` and `nginx/nginx-unprivileged:1.31.7-alpine3.24` | **not verified**. Looked up on Docker Hub and nodejs.org pages, but not pulled. If a tag is missing, use the nearest listed one |

The stand-in is not nginx. It proves the app works under the policy; only `verify-docker.sh` proves the container and `nginx.conf` itself.

To close the gap on your machine, from the repo root:
```
PLAYWRIGHT_MODULE=<path to playwright index.mjs> bash scripts/verify-docker.sh
```
(Leave the variable out to skip the browser part.)
