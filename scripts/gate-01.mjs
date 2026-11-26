import { check, read, json, finish } from './gate-lib.mjs';

const md = read('docs/pipeline/01-problem.md');
const g = json('docs/pipeline/guardrails.json');
const journey = (md.split('## Core journey')[1] ?? '').split('\n## ')[0];
check('core journey is exactly 3 numbered steps', (journey.match(/^\s*\d+\.\s+\S/gm) ?? []).length === 3);
check('guardrails.json parses', g !== null);
check('journey has 3 entries in json', g?.core_journey?.length === 3);
const keys = [
  'heavy_interactivity',
  'realtime_required',
  'offline_first',
  'visual_polish',
  'multi_user',
  'needs_identity',
  'seo_required',
  'containers_allowed',
];
check('all fluidity signals declared', g && keys.every((k) => k in (g.signals ?? {})));
check('seo_required is a boolean', typeof g?.signals?.seo_required === 'boolean');
check('every model-backed item has a fallback', g && (g.model ?? []).every((m) => m.fallback));
check('deployment is valid', g && ['mobile-first', 'desktop-web', 'cli', 'offline'].includes(g.deployment));
finish('01');
