// Stand-in for the nginx container when Docker cannot pull images (for example a sandbox with no registry access).
// It reads the add_header lines and the route rules from frontend/nginx.conf and serves frontend/dist the same way,
// so the app can be checked against the real Content-Security-Policy. It is NOT nginx: the container check
// (scripts/verify-docker.sh) is still the proof that nginx.conf itself is valid.
/* global console, process */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.STAND_IN_PORT ?? 8080);
const ROOT = 'frontend/dist';
const conf = readFileSync('frontend/nginx.conf', 'utf8');
const headers = [...conf.matchAll(/^\s*add_header\s+(\S+)\s+"([^"]*)"\s+always;/gm)].map((m) => [m[1], m[2]]);
if (headers.length < 6) throw new Error('expected the security headers in nginx.conf');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
};
const shell = () => readFileSync(join(ROOT, 'index.html'));

createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const send = (status, body, type) => {
    for (const [k, v] of headers) res.setHeader(k, v);
    res.writeHead(status, { 'Content-Type': type });
    res.end(body);
  };
  if (path === '/health') return send(200, 'ok', 'text/plain');
  if (path === '/' || /^\/(math-lab|verify)\/?$/.test(path)) return send(200, shell(), TYPES['.html']);
  const file = normalize(join(ROOT, path));
  if (file.startsWith(ROOT) && existsSync(file) && statSync(file).isFile()) {
    return send(200, readFileSync(file), TYPES[extname(file)] ?? 'application/octet-stream');
  }
  return send(404, shell(), TYPES['.html']); // error_page 404 /index.html
}).listen(PORT, () =>
  console.log(`stand-in on http://localhost:${PORT} with ${headers.length} headers from nginx.conf`),
);
