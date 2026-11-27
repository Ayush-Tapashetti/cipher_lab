/* global console, process */
// audit:vendor. Checks vendor.lock.json licenses, that every package is installed at the pinned version,
// and that nothing outside src/components/adapters imports a vendored library's source folder.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ok = new Set(['MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'ISC']);
const lock = JSON.parse(readFileSync('vendor.lock.json', 'utf8'));
let bad = 0;
const fail = (m) => {
  bad += 1;
  console.log('FAIL  ' + m);
};
for (const s of lock.sources) {
  const fontAsset = s.name.startsWith('@fontsource') && s.license === 'OFL-1.1'; // font files only, no code
  if (!ok.has(s.license) && !fontAsset) fail(`${s.name}: license ${s.license} not allowed`);
  const pkg = ['node_modules', '../node_modules'].map((d) => join(d, s.name, 'package.json')).find(existsSync);
  if (!pkg) {
    fail(`${s.name}: not installed`);
    continue;
  }
  const v = JSON.parse(readFileSync(pkg, 'utf8')).version;
  if (v !== s.version) fail(`${s.name}: lock says ${s.version}, installed ${v}`);
  if (s.adapter !== null && !existsSync(s.adapter)) fail(`${s.name}: adapter ${s.adapter} missing`);
}
const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
for (const f of walk('src')) {
  if (f.includes('components/adapters') || f.includes('components/vendor')) continue;
  if (/from ['"][^'"]*components\/vendor/.test(readFileSync(f, 'utf8'))) fail(`${f} imports vendor code directly`);
}
console.log(bad === 0 ? `audit:vendor passed (${lock.sources.length} libraries)` : `audit:vendor FAILED (${bad})`);
process.exit(bad === 0 ? 0 : 1);
