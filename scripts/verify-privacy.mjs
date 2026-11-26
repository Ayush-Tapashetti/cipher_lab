// 07g (client-only build): the "no leak" guarantees. User text must never leave the tab or be stored.
// Source: no network or storage APIs. Built files: no external hosts except the ones listed. App is noindex.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const fails = [];
const walk = (d, re) =>
  existsSync(d)
    ? readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p, re) : re.test(p) ? [p] : [];
      })
    : [];

const FORBIDDEN =
  /\bfetch\(|XMLHttpRequest|WebSocket\(|EventSource\(|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|navigator\.geolocation/;
for (const f of walk('frontend/src', /\.(ts|tsx)$/).filter((p) => !/\.spec\.ts$|\/test\//.test(p))) {
  const m = FORBIDDEN.exec(readFileSync(f, 'utf8'));
  if (m) fails.push(`${f}: uses ${m[0]}`);
}

try {
  execSync('bash scripts/check_purity.sh packages/engine/src', { stdio: 'pipe' });
} catch (e) {
  fails.push('engine purity check failed: ' + String(e.stdout ?? e));
}

// External hosts in the built bundle. These are XML namespaces and React's error-decoder text, not requests.
// localhost: react-router's base URL for parsing relative paths. reactrouter.com: text inside an error message.
const ALLOWED = [
  'localhost',
  'reactrouter.com',
  'www.w3.org',
  'react.dev',
  'reactjs.org',
  'github.com',
  'developer.mozilla.org',
  'rolldown.rs',
  'vite.dev',
];
const found = new Map();
for (const f of walk('frontend/dist', /\.(js|css|html|svg)$/)) {
  for (const m of readFileSync(f, 'utf8').matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
    const host = m[1].toLowerCase();
    found.set(host, (found.get(host) ?? 0) + 1);
  }
}
for (const [host] of found)
  if (!ALLOWED.some((a) => host === a || host.endsWith('.' + a)))
    fails.push(`built files mention external host ${host}`);

const html = readFileSync('frontend/dist/index.html', 'utf8');
if (/<(script|link)[^>]+(src|href)=["']https?:/i.test(html))
  fails.push('index.html loads a remote script or stylesheet');
if (!/name="robots" content="noindex/.test(html)) fails.push('index.html is not noindex');
if (!/Disallow: \//.test(readFileSync('frontend/dist/robots.txt', 'utf8')))
  fails.push('robots.txt does not disallow all');

console.log(
  fails.length
    ? fails.map((f) => 'FAIL ' + f).join('\n')
    : `privacy ok: no network or storage APIs in source, engine pure, hosts in build: ${[...found.keys()].join(', ') || 'none'}, noindex`,
);
process.exit(fails.length ? 1 : 0);
