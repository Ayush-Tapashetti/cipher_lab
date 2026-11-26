// Gate 08, adapted: one nginx service, no backend or database, no SEO track (stack.seo.mode is "none").
// The Docker run needs a daemon that can pull images. In a sandbox without registry access it is reported as NOT VERIFIED.
import { check, skip, exists, read, stack, sh, finish } from './gate-lib.mjs';

const s = stack();
const files = [
  'frontend/Dockerfile',
  'frontend/nginx.conf',
  'docker-compose.yml',
  'docker-compose.dev.yml',
  'scripts/verify-docker.sh',
  '.dockerignore',
  '.env.example',
];
for (const f of files) check(f + ' exists', exists(f));
const ng = read('frontend/nginx.conf');
const df = read('frontend/Dockerfile');
const compose = read('docker-compose.yml');
check('compose file is valid', sh('docker compose config -q'));
check(
  'single service, no db or backend',
  s?.containers?.services?.join() === 'frontend' && !/^\s{2}(db|backend):/m.test(compose),
);
check(
  'Dockerfile builds from the repo root and uses pinned tags',
  /^FROM node:\d+\.\d+\.\d+-alpine/m.test(df) &&
    /^FROM nginx\/nginx-unprivileged:\d+\.\d+\.\d+-alpine/m.test(df) &&
    /frontend\/package\.json/.test(df),
);
check('image does not run as root', /^USER nginx/m.test(df));
check('healthcheck present', /HEALTHCHECK/.test(df) && /healthcheck:/.test(compose) && /location = \/health/.test(ng));
check(
  'nginx sends noindex and CSP with connect-src none',
  /X-Robots-Tag "noindex/.test(ng) && /connect-src 'none'/.test(ng),
);
check(
  'nginx sets nosniff, no-referrer, frame denial',
  /nosniff/.test(ng) && /no-referrer/.test(ng) && /X-Frame-Options/.test(ng),
);
check(
  'no add_header inside a location (it would drop the security headers)',
  !/location[^{]*\{[^}]*add_header/.test(ng),
);
check('unknown URLs return a real 404', /try_files \$uri =404/.test(ng) && /error_page 404 \/index\.html/.test(ng));
check('hashed assets cached with expires', /location \/assets\/ \{ expires 1y;/.test(ng));
check('no backend proxy in nginx', !/proxy_pass/.test(ng));
check('only the frontend publishes a port', (compose.match(/ports:/g) ?? []).length === 1);
check('indexing is never switched on', !/ALLOW_INDEXING: \$\{ALLOW_INDEXING:-true/.test(compose));
check('verify script uses fail_if, not bare !', /fail_if\(\)/.test(read('scripts/verify-docker.sh')));
check(
  'app checked under the real CSP (stand-in server) with no console errors',
  (() => {
    try {
      return JSON.parse(read('reports/csp-check.json')).pass === true;
    } catch {
      return false;
    }
  })(),
);
const image = (df.match(/^FROM (nginx\/nginx-unprivileged:\S+)/m) ?? [])[1];
if (sh('docker info') && image && sh(`docker manifest inspect ${image}`))
  check('docker verification passes', sh('bash scripts/verify-docker.sh'));
else
  skip(
    'docker verification',
    'no Docker daemon, or the registry is unreachable from here; run: bash scripts/verify-docker.sh',
  );
finish('08');
