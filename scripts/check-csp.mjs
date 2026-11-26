// Runs the browser walkthrough against the stand-in server, which applies the real headers from frontend/nginx.conf.
// Proves the app works under the Content-Security-Policy (no violations show up as console errors).
// Writes reports/csp-check.json. Needs Playwright (PLAYWRIGHT_MODULE) like scripts/e2e.mjs.
/* global console, process */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = process.env.STAND_IN_PORT ?? '8091';
const BASE = `http://localhost:${PORT}`;
const server = spawn('node', ['scripts/serve-nginx-stand-in.mjs'], {
  env: { ...process.env, STAND_IN_PORT: PORT },
  stdio: 'ignore',
});
let headers = '';
for (let i = 0; i < 30 && !headers; i += 1) {
  try {
    const res = await fetch(BASE + '/');
    headers = [...res.headers.entries()].map(([k, v]) => `${k}: ${v}`).join('\n');
  } catch {
    await new Promise((r) => setTimeout(r, 300));
  }
}
const run = spawnSync('node', ['scripts/e2e.mjs'], { env: { ...process.env, E2E_BASE_URL: BASE }, stdio: 'inherit' });
server.kill();
const csp = /content-security-policy: (.*)/i.exec(headers)?.[1] ?? '';
const pass = run.status === 0 && /connect-src 'none'/.test(csp);
mkdirSync('reports', { recursive: true });
writeFileSync(
  'reports/csp-check.json',
  JSON.stringify({ ran: new Date().toISOString(), server: 'stand-in (not nginx)', csp, pass }, null, 2),
);
console.log(pass ? 'CSP check passed' : 'CSP check FAILED');
process.exit(pass ? 0 : 1);
