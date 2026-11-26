// Gate 07, adapted: 07d is "not_applicable" (no database), counted as a pass with a note. 07h runs because it checks the noindex default.
import { check, json, read, skip, finish } from './gate-lib.mjs';

for (const id of ['07a', '07b', '07c', '07d', '07e', '07f', '07g', '07h']) {
  const r = json(`reports/verification-${id}.json`);
  if (!r) check(`${id} report exists`, false);
  else if (r.status === 'pass') check(`${id} passed`, true);
  else if (r.status === 'not_applicable') check(`${id} not applicable`, true, r.reason);
  else if (r.status === 'not_verified') skip(`${id} not verified`, r.reason);
  else
    check(
      `${id} passed`,
      false,
      (r.results ?? [])
        .filter((x) => x.status === 'fail')
        .map((x) => x.name)
        .join('; '),
    );
}
const m = read('docs/pipeline/07-verification.md');
check('traceability matrix exists', m.length > 200);
check('matrix has no TODO rows', !/\|\s*TODO\s*\|/i.test(m));
const f = json('docs/pipeline/features.json');
const ids = [...(f?.features ?? []).map((x) => x.id), ...(f?.differentiators ?? []).map((x) => x.id)];
check(
  'matrix mentions every P0 feature and differentiator',
  ids.every((id) => m.includes(id)),
  ids.filter((id) => !m.includes(id)).join(', '),
);
finish('07');
