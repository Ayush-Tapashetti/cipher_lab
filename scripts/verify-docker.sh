#!/usr/bin/env bash
# Builds and runs the container, then checks routes, headers, user and image contents.
# Needs a Docker daemon that can pull images. Optional: PLAYWRIGHT_MODULE set, to also run the browser walkthrough
# against the container (this proves the app works under the real Content-Security-Policy).
set -euo pipefail
fail_if() { if "$@"; then echo "FAIL: $*"; exit 1; fi; }
cp -n .env.example .env
set -a; . ./.env; set +a

docker compose config -q
docker compose build
trap 'docker compose down -v' EXIT
docker compose up -d --wait --wait-timeout 120

B="http://localhost:${FRONTEND_PORT:-8080}"
status() { curl -s -o /dev/null -w '%{http_code}' "$1"; }
[ "$(status "$B/")" = "200" ] || { echo 'FAIL: / is not 200'; exit 1; }
[ "$(status "$B/math-lab")" = "200" ] || { echo 'FAIL: /math-lab is not 200'; exit 1; }
[ "$(status "$B/verify/")" = "200" ] || { echo 'FAIL: /verify/ is not 200'; exit 1; }
[ "$(status "$B/health")" = "200" ] || { echo 'FAIL: /health is not 200'; exit 1; }
[ "$(status "$B/definitely-not-a-page-xyz")" = "404" ] || { echo 'FAIL: unknown URL should be a real 404'; exit 1; }
[ "$(status "$B/assets/missing.js")" = "404" ] || { echo 'FAIL: missing asset should be 404'; exit 1; }

H=$(curl -sI "$B/")
echo "$H" | grep -qi '^x-robots-tag: noindex' || { echo 'FAIL: missing X-Robots-Tag noindex'; exit 1; }
echo "$H" | grep -qi "^content-security-policy:.*connect-src 'none'" || { echo "FAIL: CSP must set connect-src 'none'"; exit 1; }
echo "$H" | grep -qi '^x-content-type-options: nosniff' || { echo 'FAIL: missing nosniff'; exit 1; }
echo "$H" | grep -qi '^referrer-policy: no-referrer' || { echo 'FAIL: missing referrer policy'; exit 1; }
fail_if grep -qi '^server: nginx/' <<<"$H"
ASSET=$(curl -s "$B/" | grep -o '/assets/[^"]*\.js' | head -n1)
curl -sI "$B$ASSET" | grep -qi '^cache-control:.*max-age=31536000' || { echo 'FAIL: hashed assets should cache for a year'; exit 1; }
curl -fsS "$B/robots.txt" | grep -q '^Disallow: /' || { echo 'FAIL: robots.txt should disallow all'; exit 1; }
[ "$(status "$B/sitemap.xml")" = "404" ] || { echo 'FAIL: a noindex app must not ship a sitemap'; exit 1; }

img=$(docker compose images -q frontend | head -n1)
fail_if docker run --rm --entrypoint sh "$img" -c 'find / -name ".env*" -not -path "/proc/*" 2>/dev/null | grep -q .'
fail_if docker compose exec -T frontend sh -c 'test "$(id -u)" = 0'

if [ -n "${PLAYWRIGHT_MODULE:-}" ]; then
  E2E_BASE_URL="$B" node scripts/e2e.mjs
else
  echo 'NOT RUN: browser walkthrough against the container (set PLAYWRIGHT_MODULE to run it)'
fi

docker compose restart
docker compose up -d --wait --wait-timeout 120
docker compose logs frontend | grep -q . || { echo 'FAIL: container logs are empty'; exit 1; }
echo 'docker verification passed'
