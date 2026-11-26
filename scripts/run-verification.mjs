// Runs every sub-gate of Step 7 and writes reports/verification-07x.json.
// Client-only adaptation: 07d is "not_applicable" (no database); 07e checks the engine contract; 07g checks privacy and the eval.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const pw = () =>
  spawnSync('node', [
    '-e',
    "import(process.env.PLAYWRIGHT_MODULE ?? 'playwright').then(()=>process.exit(0),()=>process.exit(1))",
  ]).status === 0;
const axe = () => existsSync('node_modules/axe-core/axe.min.js');
// [name, command, cwd, requirement?]  requirement: [label, () => boolean]
const plan = {
  '07a': [
    ['engine types', 'npx tsc --noEmit', 'packages/engine'],
    ['frontend types', 'npx tsc --noEmit', 'frontend'],
  ],
  '07b': [
    ['frontend lint (eslint + jsx-a11y)', 'npx eslint .', 'frontend'],
    ['format check (prettier)', 'npx prettier --check .', '.'],
  ],
  '07c': [
    ['engine tests (zero network)', 'npm test', 'packages/engine'],
    ['frontend tests (zero network)', 'npm test', 'frontend'],
  ],
  '07d': 'not_applicable: no database or migrations (client-only build, decided in Step 4)',
  '07e': [['engine contract vs domain.json', 'node scripts/verify-contract.mjs', '.']],
  '07f': [
    ['production build', 'npm run build', 'frontend'],
    ['bundle budget (300 KB gzip)', 'node scripts/size.mjs', 'frontend'],
    ['vendor audit', 'npm run audit:vendor', 'frontend'],
    [
      'browser walkthrough of P0 checks + axe',
      'node scripts/e2e.mjs',
      '.',
      ['Playwright and axe-core', () => pw() && axe()],
    ],
  ],
  '07g': [
    ['break eval (labelled, seeded)', 'npm run eval', 'packages/engine'],
    ['privacy: no network or storage, engine pure, no external hosts', 'node scripts/verify-privacy.mjs', '.'],
  ],
  '07h': [['noindex default audit', 'node scripts/audit-seo.mjs', '.']],
};

mkdirSync('reports', { recursive: true });
for (const [id, steps] of Object.entries(plan)) {
  if (typeof steps === 'string') {
    writeFileSync(
      `reports/verification-${id}.json`,
      JSON.stringify(
        { stage: id, status: 'not_applicable', reason: steps.replace('not_applicable: ', ''), results: [] },
        null,
        2,
      ),
    );
    console.log(`${id}: not applicable`);
    continue;
  }
  const results = steps.map(([name, cmd, cwd, req]) => {
    if (req && !req[1]()) return { name, status: 'not_verified', reason: `${req[0]} not available` };
    const r = spawnSync(cmd, { shell: true, cwd, stdio: 'inherit', env: process.env });
    return { name, status: r.status === 0 ? 'pass' : 'fail' };
  });
  const status = results.some((r) => r.status === 'fail')
    ? 'fail'
    : results.some((r) => r.status === 'not_verified')
      ? 'not_verified'
      : 'pass';
  const reason = results
    .filter((r) => r.reason)
    .map((r) => r.reason)
    .join('; ');
  writeFileSync(`reports/verification-${id}.json`, JSON.stringify({ stage: id, status, reason, results }, null, 2));
  console.log(`${id}: ${status}${reason ? ' (' + reason + ')' : ''}`);
}
