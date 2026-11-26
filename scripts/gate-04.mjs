import { check, exists, read, json, stack, finish } from './gate-lib.mjs';

const s = stack();
const g = json('docs/pipeline/guardrails.json');
const md = read('docs/pipeline/04-architecture.md');
const env = read('.env.example') || read('docs/pipeline/.env.example');
const noBackend = s?.backend?.mode === 'none';
check('stack.json parses', s !== null);
// Adapted for a client-only build: when backend.mode is "none" the server-side checks are not applicable.
check(
  'backend language and framework set (or backend is none with a reason)',
  noBackend ? Boolean(s.backend.reason) : s?.backend?.language && s?.backend?.framework,
);
check(
  'orm and database engine set (or none)',
  noBackend ? s?.database?.engine === 'none' : s?.backend?.orm && s?.database?.engine,
);
check(
  'pure domain language and location set when there is no backend',
  !noBackend || (s?.domain?.language && s?.domain?.location),
);
check('interactivity resolved', ['conservative', 'expressive', 'experimental'].includes(s?.interactivity));
check('auth mode set', ['none', 'jwt', 'session'].includes(s?.auth?.mode));
check(
  'api prefix and health paths recorded (or no backend)',
  noBackend || (s?.backend?.api_prefix && s?.backend?.health_path && s?.backend?.ready_path),
);
check(
  'seo mode set and matches seo_required',
  ['none', 'prerender', 'ssr'].includes(s?.seo?.mode) &&
    (g?.signals?.seo_required ? s.seo.mode !== 'none' : s.seo.mode === 'none'),
);
if (s?.seo && s.seo.mode !== 'none') {
  check(
    'site url, canonical host and AI-crawler policy set',
    s.seo.site_url && s.seo.canonical_host && ['allow', 'block'].includes(s.seo.ai_crawlers),
  );
  check(
    'ssr mode uses an SSR-capable framework',
    s.seo.mode !== 'ssr' || /next|astro|remix/.test(s.frontend?.framework ?? ''),
  );
  check('prerender tool named', s.seo.mode !== 'prerender' || Boolean(s.seo.prerender_tool));
}
check(
  '.env.example has SITE_URL and ALLOW_INDEXING=false',
  /^SITE_URL=/m.test(env) && /^ALLOW_INDEXING=false/m.test(env),
);
check('.env.example exists', exists('.env.example') || exists('docs/pipeline/.env.example'));
check('repo.structure.txt exists', exists('docs/pipeline/repo.structure.txt'));
check('containers section present', !s?.containers?.enabled || md.includes('## Containers'));
check('decisions log present', md.includes('## Decisions log'));
finish('04');
