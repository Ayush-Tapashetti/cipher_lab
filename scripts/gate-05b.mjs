// Gate 05b, adapted for a client-only build: "domain/" is packages/engine, and there are no services or database.
import { check, exists, json, read, sh, grep, walk, finish } from './gate-lib.mjs';

const ENGINE = 'packages/engine';
const SRC = `${ENGINE}/src`;
const d = json('docs/pipeline/domain.json');
const pkg = json(`${ENGINE}/package.json`);
const notTest = (f) => !/__tests__|\.(spec|test)\./.test(f);
const engineSources = walk(SRC, ['.ts']).filter(notTest);
const specFiles = walk(SRC, ['.ts']).filter((f) => /\.spec\.ts$/.test(f));
const all = engineSources.map((f) => read(f)).join('\n');
const fns = d?.functions ?? [];
const unimplemented = fns
  .filter((x) => !new RegExp('export (async )?function ' + x.name + '\\b|export const ' + x.name + '\\b').test(all))
  .map((x) => x.name);
const unexported = fns
  .filter((x) => !new RegExp('\\b' + x.name + '\\b').test(read(`${SRC}/index.ts`)))
  .map((x) => x.name);

check('engine package exists', exists(`${ENGINE}/package.json`) && exists(`${SRC}/index.ts`));
check('engine has zero runtime dependencies', pkg && Object.keys(pkg.dependencies ?? {}).length === 0);
check('purity check passes on the engine', sh(`bash scripts/check_purity.sh ${SRC}`));
check(
  'engine imports nothing from node_modules (relative imports only)',
  !grep(/from ['"][^.'"][^'"]*['"]/, SRC, ['.ts']).filter(notTest).length,
);
check('no plain Error thrown in the engine', grep(/throw new Error\(/, SRC, ['.ts']).filter(notTest).length === 0);
check('every domain function contract is implemented', unimplemented.length === 0, unimplemented.join(', '));
check('every domain function is exported from the package root', unexported.length === 0, unexported.join(', '));
check(
  'every engine module has a test file',
  engineSources
    .filter((f) => !/index\.ts$|types\.ts$|errors\.ts$|english\.ts$|samples\.ts$/.test(f))
    .every((f) => {
      const base = f.split('/').pop().replace('.ts', '');
      return specFiles.some((s) => read(s).includes(`../${base}`) || read(s).includes("'../index'"));
    }) && specFiles.length >= 5,
);
check('type check (strict)', sh('npx tsc --noEmit -p tsconfig.json', ENGINE));
check('engine tests pass', sh('npx vitest run', ENGINE));
finish('05b');
