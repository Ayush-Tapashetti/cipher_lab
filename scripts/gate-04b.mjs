import { check, json, read, finish } from './gate-lib.mjs';

const e = json('docs/pipeline/experience.json');
const s = json('docs/pipeline/stack.json');
const f = json('docs/pipeline/features.json');
const models = [
  'wizard',
  'dashboard',
  'canvas-graph',
  'board-realtime',
  'conversational',
  'swipe-mobile',
  'workspace-split',
  'command-first',
  'form-centric',
];
const ok = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'ISC'];
check('experience.json parses', e !== null);
check('interaction model is valid', models.includes(e?.interaction_model));
check('signature interaction named', (e?.signature_interaction ?? '').length > 10);
check('interactivity matches stack.json', e?.interactivity === s?.interactivity);
check('user answers recorded', e?.answers?.feel && e?.answers?.first_action);
check(
  'component sources have allowed licenses',
  (e?.component_sources ?? []).length > 0 && e.component_sources.every((c) => ok.includes(c.license) && c.url),
);
check(
  'form-centric is justified',
  e?.interaction_model !== 'form-centric' || (e?.anti_template_check?.not_in_a_template ?? '').length > 10,
);
check('anti-template check filled', e?.anti_template_check?.second_best && e?.anti_template_check?.wrong_for_this);
check('bundle budget and a11y set', e?.bundle_budget_kb > 0 && e?.a11y);
check('design doc exists', read('docs/pipeline/04b-experience.md').length > 200);
check(
  'every route has a path and an indexable flag',
  (e?.routes ?? []).length > 0 && e.routes.every((r) => r.path && typeof r.indexable === 'boolean'),
);

const seoOn = s?.seo?.mode && s.seo.mode !== 'none';
const idx = (e?.routes ?? []).filter((r) => r.indexable);
if (seoOn) {
  const want = (f?.indexable_pages ?? [])
    .map((p) => p.path)
    .sort()
    .join('|');
  check(
    'indexable routes carry title, description, h1 and schema_type',
    idx.length > 0 && idx.every((r) => r.title && r.description && r.h1 && r.schema_type),
  );
  check(
    'indexable routes match features.json indexable_pages',
    idx
      .map((r) => r.path)
      .sort()
      .join('|') === want,
  );
  check(
    'titles unique and at most 60 chars',
    new Set(idx.map((r) => r.title)).size === idx.length && idx.every((r) => r.title.length <= 60),
  );
  check(
    'descriptions unique, 50 to 160 chars',
    new Set(idx.map((r) => r.description)).size === idx.length &&
      idx.every((r) => r.description.length >= 50 && r.description.length <= 160),
  );
  check('one unique h1 per indexable route', new Set(idx.map((r) => r.h1)).size === idx.length);
  check('hero image budget set', e?.hero_image_budget_kb > 0);
  check(
    'no placeholder copy in the design doc',
    !/lorem ipsum|dolor sit amet/i.test(read('docs/pipeline/04b-experience.md')),
  );
} else {
  check('no route is marked indexable when SEO is off', idx.length === 0);
}
finish('04b');
