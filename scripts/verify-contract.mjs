// 07e (client-only build): there is no HTTP API, so the contract is domain.json versus the engine's public exports.
// Checks: every function named in domain.json is exported; every error code it lists exists in errors.ts;
// the frontend imports the engine only through its package root; the engine has zero runtime dependencies.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const domain = JSON.parse(readFileSync('docs/pipeline/domain.json', 'utf8'));
const index = readFileSync('packages/engine/src/index.ts', 'utf8');
const errorsSrc = readFileSync('packages/engine/src/errors.ts', 'utf8');
const enginePkg = JSON.parse(readFileSync('packages/engine/package.json', 'utf8'));
const fails = [];

const exported = new Set([...index.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]));
const codes = new Set([...errorsSrc.matchAll(/'([A-Z][A-Za-z0-9]+)'/g)].map((m) => m[1]));
for (const fn of domain.functions) {
  if (!exported.has(fn.name)) fails.push(`domain function ${fn.name} is not exported by the engine`);
  for (const e of fn.errors ?? [])
    if (!codes.has(e)) fails.push(`${fn.name}: error code ${e} not defined in errors.ts`);
}

const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
for (const f of walk('frontend/src')) {
  if (/from ['"]@cipher-lab\/engine\/|from ['"][^'"]*packages\/engine/.test(readFileSync(f, 'utf8'))) {
    fails.push(`${f} imports engine internals instead of the package root`);
  }
}
if (Object.keys(enginePkg.dependencies ?? {}).length > 0) fails.push('engine has runtime dependencies');

console.log(
  fails.length
    ? fails.map((f) => 'FAIL ' + f).join('\n')
    : `contract ok: ${domain.functions.length} domain functions exported, error codes defined, engine has no runtime deps`,
);
process.exit(fails.length ? 1 : 0);
