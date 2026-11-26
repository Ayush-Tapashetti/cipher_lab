#!/usr/bin/env bash
# Fails (exit 1) if the domain layer imports HTTP, network, DB, or env access, or reads the clock or randomness.
# Usage: check_purity.sh <domain-dir> [<domain-dir> ...]
set -u
if [ $# -eq 0 ]; then
  echo "usage: check_purity.sh <domain-dir> [<domain-dir> ...]" >&2; exit 2
fi

PATTERN='(from|import)[[:space:]]+(fastapi|starlette|flask|django|httpx|requests|aiohttp|urllib3|sqlmodel|sqlalchemy|psycopg|prisma)\b'
PATTERN+='|require\((.express.|.fastify.|.axios.|.node-fetch.|.@prisma/client.)\)'
PATTERN+='|from[[:space:]]+.(express|fastify|next|axios|node-fetch|@prisma/client|react|react-dom).'
PATTERN+='|\bos\.environ\b|\bos\.getenv\b|\bprocess\.env\b|\bfetch\('
PATTERN+='|\bdatetime\.(now|utcnow)\(|\bDate\.now\(|\bnew Date\(\)|\bMath\.random\('
PATTERN+='|\b(window|document|localStorage|sessionStorage)\.'

status=0
for dir in "$@"; do
  if [ ! -d "$dir" ]; then echo "not a directory: $dir" >&2; exit 2; fi
  hits=$(grep -rnE --include='*.py' --include='*.ts' --include='*.tsx' \
         --exclude='*.test.ts' --exclude='*.spec.ts' --exclude='test_*.py' --exclude='*_test.py' \
         "$PATTERN" "$dir" || true)
  if [ -n "$hits" ]; then
    echo "PURITY VIOLATIONS in $dir:"; echo "$hits"; status=1
  fi
done

if [ $status -eq 0 ]; then echo "purity check passed"; fi
exit $status
