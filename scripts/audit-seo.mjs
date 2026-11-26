// 07h. This project has stack.seo.mode "none", so the audit checks the default: the app must NOT be indexable.
import { existsSync, readFileSync } from 'node:fs';

const stack = JSON.parse(readFileSync('docs/pipeline/stack.json', 'utf8'));
if (stack.seo?.mode && stack.seo.mode !== 'none') {
  console.log('FAIL seo mode is on but this project only ships the noindex audit; use the full 07h audit');
  process.exit(1);
}
const fails = [];
const html = readFileSync('frontend/dist/index.html', 'utf8');
if (!/name="robots" content="noindex/.test(html)) fails.push('dist/index.html is not noindex');
if (!/<title>[^<]{3,}<\/title>/.test(html) || /<title>\s*(vite|react)/i.test(html))
  fails.push('title missing or a framework default');
if (!/name="description"/.test(html)) fails.push('meta description missing');
const robots = existsSync('frontend/dist/robots.txt') ? readFileSync('frontend/dist/robots.txt', 'utf8') : '';
if (!/User-agent: \*\s*\nDisallow: \//.test(robots)) fails.push('robots.txt does not disallow everything');
if (existsSync('frontend/dist/sitemap.xml')) fails.push('sitemap.xml exists for a noindex app');
console.log(
  fails.length ? fails.map((f) => 'FAIL ' + f).join('\n') : 'SEO off: app is noindex, robots disallows all, no sitemap',
);
process.exit(fails.length ? 1 : 0);
