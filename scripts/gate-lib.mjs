import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const checks = [];
export const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
export const skip = (name, reason) =>
  checks.push({ name, pass: true, skipped: true, detail: 'NOT VERIFIED: ' + reason });
export const exists = (p) => existsSync(p);
export const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
export const json = (p) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};
export const stack = () => json('docs/pipeline/stack.json');
export const sh = (cmd, cwd = '.') => {
  try {
    execSync(cmd, { cwd, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

export function walk(dir, exts = ['.ts', '.tsx', '.py']) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (['node_modules', '.git', 'dist', '__pycache__', '.venv'].includes(n)) return [];
    return statSync(p).isDirectory() ? walk(p, exts) : exts.some((e) => p.endsWith(e)) ? [p] : [];
  });
}
export const grep = (re, dir, exts) => walk(dir, exts).filter((f) => re.test(read(f)));

export function finish(stage) {
  for (const c of checks) {
    const tag = c.skipped ? 'SKIP' : c.pass ? 'PASS' : 'FAIL';
    console.log(tag + '  ' + c.name + (c.detail ? ' - ' + c.detail : ''));
  }
  const failed = checks.filter((c) => !c.pass).length;
  const skipped = checks.filter((c) => c.skipped);
  const strictFail = process.env.STRICT === '1' && skipped.length > 0;
  const pass = failed === 0 && !strictFail;
  console.log(
    '\n' +
      stage +
      ': ' +
      (pass ? 'gate passed' : 'gate FAILED') +
      (skipped.length ? ' (' + skipped.length + ' not verified)' : ''),
  );
  const f = 'docs/pipeline/build.state.json';
  const s = json(f);
  if (s) {
    s.stages = s.stages ?? {};
    s.stages[stage] = {
      ...(s.stages[stage] ?? {}),
      gate: pass ? 'pass' : 'fail',
      gate_run: new Date().toISOString(),
      unverified: skipped.map((c) => c.name),
    };
    writeFileSync(f, JSON.stringify(s, null, 2));
  }
  process.exit(pass ? 0 : 1);
}
