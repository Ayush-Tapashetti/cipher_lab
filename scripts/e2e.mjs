// Browser walkthrough of the P0 acceptance checks plus an axe-core scan. Starts `vite preview` itself.
// Needs Playwright (set PLAYWRIGHT_MODULE to its index.mjs if it is not importable as "playwright") and a built frontend.
// Writes reports/p0-acceptance.json and reports/axe-report.json.
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const PORT = process.env.E2E_PORT ?? '4173';
// E2E_BASE_URL points the run at an already running server (the Docker container); otherwise `vite preview` is started.
const BASE = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const axeSource = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
mkdirSync('reports', { recursive: true });

const server = process.env.E2E_BASE_URL
  ? { kill() {} }
  : spawn('npx', ['vite', 'preview', '--port', PORT, '--strictPort'], { cwd: 'frontend', stdio: 'ignore' });
for (let i = 0; i < 30; i += 1) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {
    await new Promise((r) => setTimeout(r, 500));
  }
}

const results = [];
const rec = (check, pass, detail = '') => {
  results.push({ check, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${check}${detail ? ' - ' + detail : ''}`);
};
const axePages = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => {
    // The deliberate visit to /nope is a real 404 under nginx, which the browser logs as a console error.
    if (m.type() === 'error' && !m.location().url.endsWith('/nope')) errs.push(m.text());
  });
  const scan = async (name) => {
    await page.evaluate(axeSource); // CDP evaluate is not blocked by the page CSP, unlike addScriptTag
    const r = await page.evaluate(() =>
      // eslint-disable-next-line no-undef
      axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }),
    );
    axePages.push({
      name,
      violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
    });
  };
  const out = () =>
    page
      .locator('output')
      .innerText()
      .then((t) => t.trim());
  const live = () => page.locator('p[aria-live="polite"]').first().innerText();
  const goPane = async (k) => {
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press(k);
    await page.waitForTimeout(400);
  };

  await page.goto(BASE + '/');
  const area = page.locator('main textarea').first();
  await area.fill('HELLO');
  await page.getByLabel('shift k').fill('3');
  rec('FEAT-001 HELLO with shift 3 gives KHOOR', (await out()) === 'KHOOR');
  await page.getByText('Decrypt', { exact: true }).click();
  await area.fill('KHOOR');
  rec('FEAT-001 decrypting KHOOR with shift 3 gives HELLO', (await out()) === 'HELLO');
  await page.getByText('Encrypt', { exact: true }).click();
  await page.getByText('Affine', { exact: true }).click();
  await page.getByLabel('a', { exact: true }).fill('5');
  await page.getByLabel('b', { exact: true }).fill('8');
  await area.fill('AFFINE CIPHER');
  rec('FEAT-001 affine 5,8 gives IHHWVC SWFRCP', (await out()) === 'IHHWVC SWFRCP');
  await page.getByLabel('a', { exact: true }).fill('2');
  const msg = await live();
  rec('FEAT-001 a=2 is rejected with a gcd reason', /gcd\(2, 26\) = 2/.test(msg), msg);
  rec('FEAT-001 last valid output stays visible while the key is invalid', (await out()) === 'IHHWVC SWFRCP');
  await page.getByText('Substitution', { exact: true }).click();
  await page.getByLabel(/^key \(26/).fill('AABCDEFGHIJKLMNOPQRSTUVWXY');
  const dup = await live();
  rec('FEAT-002 repeated and missing letters are named', /repeated: A/.test(dup) && /missing: Z/.test(dup), dup);
  await page.getByLabel(/^key \(26/).fill('QWERTYUIOPASDFGHJKLZXCVBNM');
  await area.fill('Hello, World 42!');
  const sub = await out();
  rec('FEAT-002 case, spaces, digits and punctuation preserved', /^[A-Z][a-z]{4}, [A-Z][a-z]{4} 42!$/.test(sub), sub);

  await page.getByText('Caesar', { exact: true }).click();
  await page.getByLabel('shift k').fill('3');
  await area.fill('Attack at dawn');
  await goPane('2');
  const slider = page.getByRole('slider', { name: 'Caesar shift' });
  rec('DIFF wheel shows shift 3', (await slider.getAttribute('aria-valuenow')) === '3');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowRight');
  rec('wheel keyboard: 3 - 1 - 5 = 23 (mod 26)', (await slider.getAttribute('aria-valuenow')) === '23');
  await page.keyboard.press('Home');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'reports/ui-wheel.png' });

  await goPane('4');
  const trace = await live();
  rec('FEAT-005 trace outputs equal the cipher output', /all \d+ outputs equal/.test(trace), trace);

  await goPane('5');
  await page.getByRole('button', { name: 'Load sample ciphertext' }).click();
  await page.getByRole('button', { name: 'Break', exact: true }).click();
  await page.waitForTimeout(800);
  const row = (await page.locator('table:has(caption:text("Candidate keys")) tbody tr').first().innerText()).replace(
    /\s+/g,
    ' ',
  );
  rec(
    'FEAT-004 sample break: top-ranked key is k = 11 and selected',
    /k = 11/.test(row) && /Selected/.test(row),
    row.slice(0, 60),
  );
  const recovered = await page.locator('#recovered').locator('..').innerText();
  rec(
    'FEAT-004 recovered plaintext starts with the original and confidence is shown',
    /Modular arithmetic is the arithmetic/.test(recovered) && /confidence\s+(high|medium|low)/i.test(recovered),
  );
  await page.screenshot({ path: 'reports/ui-break.png' });
  await page.getByLabel('Ciphertext to analyse').fill('Hi there');
  await page.getByRole('button', { name: 'Break', exact: true }).click();
  await page.waitForTimeout(400);
  const short = await page.locator('#recovered').locator('..').innerText();
  rec(
    'FEAT-004 short ciphertext shows low confidence',
    /confidence\s+low/i.test(short),
    short.replace(/\s+/g, ' ').slice(0, 60),
  );

  await goPane('3');
  await page.getByLabel('Ciphertext to analyse').fill('AAB');
  await page.locator('details summary').first().click();
  const rows = await page.locator('details tbody tr').allInnerTexts();
  rec(
    'FEAT-003 AAB gives A 66.67% and B 33.33%',
    /A\s+66\.67%/.test(rows[0] ?? '') && /B\s+33\.33%/.test(rows[1] ?? ''),
  );
  await page.getByLabel('Ciphertext to analyse').fill('');
  rec('FEAT-003 empty input shows an empty state, not NaN', !/NaN/.test(await page.locator('main').innerText()));

  await page.goto(BASE + '/math-lab');
  const ks = await page.locator('table').first().innerText();
  rec(
    'FEAT-005 key space shows 26, 312 and 26!',
    ks.includes('403291461126605635584000000') && /\b312\b/.test(ks) && /\b26\b/.test(ks),
  );
  const units = await page.locator('table:has(caption:text("Units mod 26")) tbody tr').count();
  rec('FEAT-005 inverse table lists 12 units', units === 12, String(units));
  await page.getByRole('button', { name: /multipliers/ }).click();
  rec(
    'DIFF-004 group of units shows generators 7, 11, 15, 19',
    /generators 7, 11, 15, 19/.test(await page.locator('main').innerText()),
  );
  await page.screenshot({ path: 'reports/ui-mathlab.png', fullPage: true });

  await page.goto(BASE + '/verify');
  await page.getByRole('button', { name: 'Run all checks' }).click();
  rec('DIFF-002 exhaustive checks 375/375', /375 \/ 375 passed/.test(await page.locator('main').innerText()));
  rec(
    'DIFF-005 known-plaintext panel recovers a key',
    /Key: a = \d+, b = \d+/.test(await page.locator('#kp').locator('..').innerText()),
  );
  await page.getByRole('button', { name: 'Run experiment' }).click();
  await page.waitForSelector('figure svg', { timeout: 60000 });
  const u = await page.locator('#uni').locator('..').innerText();
  rec('DIFF-006 success curve renders with a text table', /Caesar/.test(u) && /Affine/.test(u));
  await page.screenshot({ path: 'reports/ui-verify.png', fullPage: true });

  await page.goto(BASE + '/');
  for (const k of ['1', '2', '3', '4', '5']) {
    await goPane(k);
    if (k === '5') {
      await page.getByRole('button', { name: 'Load sample ciphertext' }).click();
      await page.getByRole('button', { name: 'Break', exact: true }).click();
      await page.waitForTimeout(500);
    }
    await scan('workspace pane ' + k);
  }
  for (const p of ['/math-lab', '/verify', '/nope']) {
    await page.goto(BASE + p);
    await page.waitForTimeout(400);
    await scan(p);
  }
  rec('no console or page errors across the walkthrough', errs.length === 0, errs.join(' | '));
} finally {
  await browser.close();
  server.kill();
}

const total = axePages.reduce((t, p) => t + p.violations.length, 0);
writeFileSync('reports/p0-acceptance.json', JSON.stringify({ ran: new Date().toISOString(), results }, null, 2));
writeFileSync(
  'reports/axe-report.json',
  JSON.stringify(
    { tool: 'axe-core 4.14.1 (MPL-2.0, dev only)', ran: new Date().toISOString(), violations: total, pages: axePages },
    null,
    2,
  ),
);
console.log(`axe violations: ${total}`);
process.exit(results.every((r) => r.pass) && total === 0 ? 0 : 1);
