// Gate 06c, adapted for a client-only build: no API client, no SEO track (stack.seo.mode is "none").
// The "no fetch" rule still applies to pages and components, and the engine package is the only source of maths.
import { execSync } from 'node:child_process';
import { check, exists, json, sh, grep, finish } from './gate-lib.mjs';

const f = json('docs/pipeline/features.json');
const ids = [
  ...(f?.features ?? []).filter((x) => x.priority === 'P0' && x.kind !== 'infrastructure').map((x) => x.id),
  ...(f?.differentiators ?? []).map((x) => x.id),
];
const src = (re, exts = ['.ts', '.tsx']) => grep(re, 'frontend/src', exts);
check('type check', sh('npx tsc --noEmit', 'frontend'));
check('lint passes (includes jsx-a11y)', sh('npx eslint .', 'frontend'));
check('no any', src(/:\s*any\b|\bas any\b/).length === 0);
check('no fetch anywhere in the frontend', src(/\bfetch\(/).length === 0);
check(
  'every P0 feature and differentiator has a manifest',
  ids.length > 0 && ids.every((id) => exists(`frontend/src/features/${id}.manifest.json`)),
);
check(
  'manifests name existing pages',
  ids.every((id) => {
    const m = json(`frontend/src/features/${id}.manifest.json`);
    return m?.page && exists('frontend/' + m.page) && (m.states ?? []).length > 0;
  }),
);
check('vendor code imported only via adapters, audit:vendor passes', sh('npm run audit:vendor', 'frontend'));
check(
  'components.manifest.json lists every adopted library',
  (json('frontend/components.manifest.json')?.components ?? []).length >= 5,
);
check(
  'no placeholder copy',
  src(/lorem ipsum|dolor sit amet|your text here|built in Step 6C/i, ['.ts', '.tsx', '.json']).length === 0,
);
check('no clickable div or span', src(/<(div|span)[^>]*onClick/, ['.tsx']).length === 0);
check(
  'no direct localStorage or network use of user text',
  src(/localStorage|sessionStorage|XMLHttpRequest|sendBeacon/).length === 0,
);
check(
  'maths comes from the engine (no mod arithmetic re-implemented in features)',
  grep(/%\s*26\b/, 'frontend/src/features/mathlab', ['.tsx']).length === 0,
);
check('build succeeds', sh('npm run build', 'frontend'));
check(
  'initial JS within 300 KB gzip',
  (() => {
    try {
      return execSync('node scripts/size.mjs', { cwd: 'frontend' }).toString().includes('ok');
    } catch {
      return false;
    }
  })(),
);
check(
  'P0 acceptance report exists and all pass',
  (json('reports/p0-acceptance.json')?.results ?? []).length >= 15 &&
    json('reports/p0-acceptance.json').results.every((r) => r.pass),
);
check('axe report has zero violations', json('reports/axe-report.json')?.violations === 0);
finish('06c');
