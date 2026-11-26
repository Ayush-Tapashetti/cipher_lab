import { check, json, read, finish } from './gate-lib.mjs';

const d = json('docs/pipeline/domain.json');
const f = json('docs/pipeline/features.json');
const md = read('docs/pipeline/03-domain-schema.md');
const ents = d?.entities ?? [];
const names = new Set(ents.map((e) => e.name));
const feats = f?.features ?? [];
const missing = feats.flatMap((x) => (x.touches_entity ?? []).filter((n) => !names.has(n)).map((n) => x.id + ':' + n));
check('domain.json parses', d !== null);
check(
  'every entity has a name, a primary key and an owning feature',
  ents.length > 0 && ents.every((e) => e.name && e.fields?.some((x) => x.pk) && e.features?.length),
);
check(
  'every entity owner is a real feature',
  ents.every((e) => (e.features ?? []).every((id) => feats.some((x) => x.id === id))),
);
check('every feature entity exists in the model', missing.length === 0, missing.join(', '));
check(
  'every P0 product feature owns an entity',
  feats
    .filter((x) => x.priority === 'P0' && x.kind !== 'infrastructure')
    .every((x) => ents.some((e) => (e.features ?? []).includes(x.id))),
);
check(
  'relations point at real entities with a delete rule',
  ents.every((e) => (e.relations ?? []).every((r) => names.has(r.to) && r.on_delete)),
);
check(
  'indexes name the query they serve',
  ents.every((e) => (e.indexes ?? []).every((i) => i.fields?.length && i.query)),
);
check(
  'no float money fields',
  ents.every((e) =>
    e.fields.every(
      (x) => !/amount|price|cost|balance|total|fee/i.test(x.name) || !['float', 'double', 'number'].includes(x.type),
    ),
  ),
);
const sms = d?.state_machines ?? [];
check(
  'state machines are consistent',
  sms.every(
    (m) =>
      m.states.includes(m.initial) &&
      m.transitions.every((t) => m.states.includes(t.from) && m.states.includes(t.to) && t.event),
  ),
);
check(
  'function contracts have signatures and a deterministic flag',
  (d?.functions ?? []).every((x) => x.name && x.signature && typeof x.deterministic === 'boolean'),
);
check('FEAT-AUTH has a User entity', !feats.some((x) => x.id === 'FEAT-AUTH') || names.has('User'));
check('ER diagram and traceability present', /erDiagram/.test(md) && /## Traceability/.test(md));
finish('03');
