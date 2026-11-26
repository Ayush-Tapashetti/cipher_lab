# 04 Architecture (FROZEN once confirmed)

Decision from the user (2026-11-23): **no backend now, engine isolated** so a backend can be added next year without a rewrite.

## Stack
| Dimension | Choice | Why (requirement or signal it serves) |
|---|---|---|
| Backend | none | Hard limit: user text never leaves the browser. Every Step 3 function is pure math on strings and integers, so nothing needs a server. |
| Domain engine | `@cipher-lab/engine`, a TypeScript package with zero runtime dependencies in `packages/engine` | Step 3 pure contracts; isolated so tests, the report and a future server can all use it unchanged. |
| Database | none | No persistence and no identity (guardrails: needs_identity false, text never stored). |
| Language | TypeScript 6.0.3, strict, target ES2022 | Strict TS is mandatory; ES2022 gives `bigint` for 26! = 403291461126605635584000000. |
| Frontend framework | React 19 + Vite 8 | Signals: heavy_interactivity true; SPA is enough because seo_required is false. |
| Router | react-router-dom 7 (history mode) | Three real screens (`/`, `/math-lab`, `/verify`) plus a real 404. |
| State | zustand | Several distant panes (input, wheel, histogram, trace, break) share text, key and selection. TanStack Query is not needed: there is no server state. |
| Styling | Tailwind CSS 4 + CSS design tokens | Fast dark-theme work with a token file; no heavy runtime CSS framework. |
| Interaction libraries | react-resizable-panels, cmdk, motion, sonner, lucide-react | Chosen in Step 4B for the tiling workspace, command palette, wheel animation and toasts. |
| Testing | Vitest + fast-check (properties) + Testing Library + Playwright | Correctness is a hard limit: property tests prove D(E(m))=m; Playwright captures report screenshots. |
| Lint / format | ESLint 9 + typescript-eslint + jsx-a11y, Prettier | a11y is a stated requirement (WCAG-AA). |
| Containers | Docker, one service (nginx serving the static build) | containers_allowed true; app still runs natively with `npm run dev`. |

## Dials
- `interactivity`: **experimental**. FEAT-004 is tagged experimental, heavy_interactivity is true and visual_polish is high.
- `realtime`: none. `auth.mode`: none. `model_backed`: false.
- `frontend.state`: zustand.
- `seo.mode`: none (see below).

## Rendering & SEO
`seo_required` is false, so `seo.mode` is `none`: a plain client-side SPA. Every route is `noindex` (`X-Robots-Tag` header and a disallow-all `robots.txt`, written by the container at start-up unless `ALLOW_INDEXING=true`, which this project never sets). No sitemap, no canonical host, no AI-crawler policy needed.

## Layering
```
React UI (features/*)  ->  zustand store (state/)  ->  @cipher-lab/engine (pure)
```
- Arrows only go one way. The engine never imports React, the DOM, `window`, the clock or `Math.random`; randomness enters only as an explicit seeded `Rng` argument.
- Enforced two ways: the engine package has an empty `dependencies` list and a tsconfig without the DOM lib, and an ESLint rule forbids the frontend from importing engine internals (only the package root).
- Components never implement cipher or statistics logic; they call the engine and render the result.
- There is no router/service/model server stack and no `integrations/` or error-envelope layer; domain errors are typed errors thrown by the engine and mapped to inline messages in the UI.

### The five "routes" from Step 2 become engine calls
| Logical route (features.json) | Engine call |
|---|---|
| POST /cipher/encrypt | `encrypt(text, validateKey(spec))` |
| POST /cipher/decrypt | `decrypt(text, validateKey(spec))` |
| POST /keys/validate | `validateKey(spec)` |
| POST /analysis/frequency | `letterCounts`, `relativeFrequencies`, `indexOfCoincidence` |
| POST /analysis/break | `rankCaesarCandidates` / `rankAffineCandidates`, `breakConfidence` |
| POST /cipher/trace | `traceCipher(text, key, direction)` |

## Data flow & trust boundaries
```mermaid
flowchart LR
  user([User]) -->|types text, edits key| ui
  subgraph browser[Browser tab: the only trust zone]
    ui[React UI] --> store[zustand store]
    store --> engine[@cipher-lab/engine<br/>pure functions]
    engine --> store
    store --> ui
  end
  subgraph container[Docker container: frontend]
    nginx[nginx: static files, CSP connect-src none, noindex]
  end
  nginx -->|serves JS/CSS/HTML once| browser
```
- No request carries user text. The container only serves static files; after load the app makes no network calls (enforced by CSP `connect-src 'none'`, verified in Step 7).
- No third-party scripts, fonts from CDNs, analytics or trackers. The font is bundled.
- Nothing is persisted: no `localStorage` of user text. (A future shareable link would encode text in the URL fragment only, and only when the user asks.)

## Security & masking
- Nothing to mask: no PII is collected, stored or sent; no secrets exist in this project.
- CSP: `default-src 'self'; connect-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'` (finalised in Step 8). `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.
- Input handling: text is rendered as text (React escaping), never as HTML. Very long input is capped (soft limit 50,000 characters) to keep the UI responsive.
- CORS and rate limits: not applicable (no API).

## Containers (decisions only)
- One service, `frontend`: multi-stage image, `node:24-alpine` build stage, `nginx:1.30-alpine` runtime stage. Verify the exact tags exist at Step 8.
- Published host port: 8080 (nginx). No `db`, `backend`, `cache` or `worker`.
- No API prefix, no `/api` proxy, no `/health` backend probes. The container healthcheck requests `/` and expects 200. Unknown paths return a real 404 only for asset-like requests; app routes use the SPA fallback (the app renders its own NotFound for unknown app paths, and everything is `noindex`).
- No volumes (no state). No secrets. Configuration is by environment variables at runtime; `SITE_URL` is a build argument but only affects absolute URLs, which this site barely uses.
- Crawl hygiene (robots, `noindex`) is written by `frontend/docker/40-seo.sh` in Step 8.

## Folder structure
See `repo.structure.txt`.

## Environment variables
See `.env.example` (SITE_URL, ALLOW_INDEXING=false, SEO_MODE=none, FRONTEND_PORT, DEV_PORT). There are no secrets.

## Pinned dependencies (incl. base images)
Versions were looked up on the npm registry on 2026-11-23 (licenses from the registry's metadata).

| Package | Version | License | Notes |
|---|---|---|---|
| react, react-dom | 19.3.1 | MIT | |
| @types/react, @types/react-dom | 19.3.0 | MIT | |
| vite | 8.3.8 | MIT | |
| @vitejs/plugin-react | 6.3.0 | MIT | peer: vite ^8 |
| typescript | **6.0.3** | Apache-2.0 | 7.0.2 exists but typescript-eslint 8.73.0 requires `<6.1.0` |
| typescript-eslint | 8.73.0 | MIT | |
| eslint, @eslint/js | **9.39.5** | MIT | ESLint 10 exists but eslint-plugin-jsx-a11y 6.10.2 only supports up to ^9 |
| eslint-plugin-jsx-a11y | 6.10.2 | MIT | |
| prettier | 3.10.1 | MIT | |
| tailwindcss, @tailwindcss/vite | 4.3.5 | MIT | |
| react-router-dom | 7.18.6 | MIT | |
| zustand | 5.1.0 | MIT | |
| react-resizable-panels | 4.24.1 | MIT | tiling panes |
| cmdk | 1.1.1 | MIT | command palette |
| motion | 14.14.0 | MIT | wheel and histogram animation |
| sonner | 2.0.8 | MIT | toasts |
| lucide-react | 1.77.0 | ISC | icons |
| @fontsource-variable/jetbrains-mono | 5.3.0 | OFL-1.1 | bundled font (a font, not a component) |
| vitest | 5.1.1 | MIT | peer: vite ^6.4 / ^7 / ^8 |
| fast-check | 4.11.0 | MIT | property tests |
| jsdom | 31.0.1 | MIT | |
| @testing-library/react | 16.3.3 | MIT | |
| @playwright/test | 1.65.1 | Apache-2.0 | report screenshots, UI smoke |
| @types/node | 24.19.2 | MIT | |

Base images: `node:24-alpine` (Node 24 is on nodejs.org's LTS list; v26 and v22 are also listed as LTS) and `nginx:1.30-alpine` (nginx stable branch, 1.30.7 as of 2026-11-18). Docker Hub tags are not verified yet; Step 8 confirms them.

`@cipher-lab/engine` has **zero** runtime dependencies.

## Run commands
```
npm ci                      # install workspaces
npm run dev -w frontend     # dev server on :5173
npm test                    # engine + frontend tests
npm run typecheck           # tsc --noEmit in both packages
npm run lint
npm run build -w frontend   # static build in frontend/dist
docker compose up --build   # http://localhost:8080 (Step 8)
```

## Pipeline impact of "no backend"
These stages do not apply and will be marked `skipped` when this step is confirmed: 05a (backend core), 05a5 (error envelope and auth), 05c (integrations), 05d contract and handlers (API and OpenAPI), 06a (generated API client).
Re-scoped: **05b** becomes "implement `packages/engine` against the Step 3 contracts, with tests"; **06b/06c** build the frontend directly on the engine; **07** drops contract tests (07e) and instead verifies the CSP/no-network claim and the exhaustive round-trip checks; **08** builds a single nginx image.

## Decisions log
- No backend: rejected a Node/Python API with a database because the hard limit says text never leaves the browser, every function is pure, and a server would add a contract, error layer, DB and a second container for no feature. (User confirmed.)
- Engine as its own workspace package: rejected keeping it as a folder inside `frontend/` because the user wants the project to grow next year; a separate zero-dependency package can be imported by a future server and unit-tested without React. Cost: a small workspace setup.
- zustand over React Context: rejected Context because input, wheel, histogram, trace and break panes all read the same text and key and re-render too widely with Context.
- No TanStack Query: rejected because there is no server state.
- TypeScript 6.0.3 instead of 7.0.2: rejected 7.x because typescript-eslint 8.73.0 supports only `<6.1.0`; revisit when typescript-eslint adds support.
- ESLint 9.39.5 instead of 10.x: rejected 10.x because eslint-plugin-jsx-a11y 6.10.2 only declares support up to ESLint 9 and a11y linting is a requirement.
- SEO `none`: rejected prerender/SSR because the site is not meant to be found through search.
- Single-container Docker: rejected compose with backend and db; containers stay optional (the app runs natively).
- CSP `connect-src 'none'`: chosen to make "text never leaves the browser" a checkable property rather than a promise.
- `bigint` for key-space sizes: rejected floating point because 26! exceeds 2^53 and must be printed exactly.
- Step 8 (2026-11-25): static security headers in `nginx.conf` instead of a start-up `40-seo.sh`, because nothing varies at runtime; unknown URLs return a real 404 instead of the SPA fallback; image namespace `nginx/nginx-unprivileged` (the `nginxinc` one is archived); Vite asset inlining off so the CSP needs no `data:` source. Details in `08-docker.md`.
