import { check, json, finish } from './gate-lib.mjs';

const f = json('docs/pipeline/features.json');
const g = json('docs/pipeline/guardrails.json');
const feats = f?.features ?? [];
const product = feats.filter((x) => x.kind !== 'infrastructure');
check('features.json parses', f !== null);
check('at most 5 P0 product features', product.filter((x) => x.priority === 'P0').length <= 5);
check(
  'each feature has acceptance',
  feats.every((x) => x.acceptance),
);
check(
  'product features map to an entity and a route',
  product.every((x) => x.touches_entity?.length && x.touches_route?.length),
);
check(
  'interactivity tags valid',
  feats.every((x) => ['none', 'low', 'high', 'experimental'].includes(x.interactivity)),
);
check(
  '1 to 6 differentiators (raised from 3 at user request)',
  (f?.differentiators ?? []).length >= 1 && f.differentiators.length <= 6,
);
const hasAuth = feats.some((x) => x.id === 'FEAT-AUTH');
const authCut = (f?.cut ?? []).some((x) => x.name === 'FEAT-AUTH');
check('FEAT-AUTH matches needs_identity', g?.signals?.needs_identity ? hasAuth : !hasAuth && authCut);

const seoOn = g?.signals?.seo_required;
const pages = f?.indexable_pages ?? [];
const hasSeo = feats.some((x) => x.id === 'FEAT-SEO');
const seoCut = (f?.cut ?? []).some((x) => x.name === 'FEAT-SEO');
check('FEAT-SEO matches seo_required', seoOn ? hasSeo : !hasSeo && seoCut && pages.length === 0);
if (seoOn) {
  check(
    'at least 3 indexable pages (or a written justification)',
    pages.length >= 3 || Boolean(f?.single_page_justified),
  );
  check('page paths are unique', new Set(pages.map((p) => p.path)).size === pages.length);
  check(
    'titles unique and at most 60 chars',
    new Set(pages.map((p) => p.title)).size === pages.length && pages.every((p) => p.title && p.title.length <= 60),
  );
  check(
    'descriptions unique, 50 to 160 chars',
    new Set(pages.map((p) => p.description)).size === pages.length &&
      pages.every((p) => p.description && p.description.length >= 50 && p.description.length <= 160),
  );
  check(
    'each page has an h1, a search intent and a schema type',
    pages.every((p) => p.h1 && p.intent && p.schema_type),
  );
  check('no placeholder copy', !/lorem|ipsum|\btbd\b|todo|placeholder/i.test(JSON.stringify(pages)));
}
finish('02');
