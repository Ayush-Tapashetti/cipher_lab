// Gate 06b. Identical to the pipeline's gate except: the layout check also accepts a layouts/RootLayout.tsx path,
// and SEO checks only run when stack.seo.mode is not "none" (this project: none).
import { check, exists, read, stack, sh, grep, finish } from './gate-lib.mjs';

const s = stack();
const html = read('frontend/index.html');
check('type check', sh('npx tsc --noEmit', 'frontend'));
check('lint (eslint + jsx-a11y)', sh('npx eslint .', 'frontend'));
check('npm run build succeeds on shell routes', sh('npm run build', 'frontend'));
check('design tokens exist', exists('frontend/src/styles/tokens.css'));
check('layout file exists', exists('frontend/src/layouts/RootLayout.tsx') || exists('frontend/src/layouts/Shell.tsx'));
const authOn = s?.auth?.mode && s.auth.mode !== 'none';
check('AuthProvider exists iff auth is on', Boolean(authOn) === exists('frontend/src/providers/AuthProvider.tsx'));
check('no direct fetch in shell', grep(/\bfetch\(/, 'frontend/src/layouts', ['.tsx']).length === 0);
check(
  'reduced motion honoured',
  grep(/prefers-reduced-motion|useReducedMotion/, 'frontend/src', ['.ts', '.tsx', '.css']).length > 0,
);
check(
  'no hash routing',
  grep(/HashRouter|createHashRouter|href=["']#\//, 'frontend/src', ['.ts', '.tsx']).length === 0,
);
check(
  'index.html has a real title, not the Vite default',
  /<title>[^<]{3,}<\/title>/.test(html) && !/<title>\s*(vite|react)[^<]*<\/title>/i.test(html),
);
check(
  'index.html has lang, viewport and description',
  /<html[^>]*\blang=/.test(html) && /name="viewport"/.test(html) && /name="description"/.test(html),
);
check(
  'app is noindex when SEO is off',
  s?.seo?.mode !== 'none' ||
    (/name="robots" content="noindex/.test(html) && /Disallow: \//.test(read('frontend/public/robots.txt'))),
);
check(
  'vendor.lock.json lists every adopted library',
  ['react-resizable-panels', 'cmdk', 'motion', 'sonner', 'lucide-react'].every((n) =>
    read('frontend/vendor.lock.json').includes(`"${n}"`),
  ),
);
check(
  'navigation uses AppLink (no navigate() inside onClick of a button for pages)',
  exists('frontend/src/components/ui/AppLink.tsx') && grep(/AppLink/, 'frontend/src/layouts', ['.tsx']).length > 0,
);
if (s?.seo && s.seo.mode !== 'none') {
  check('Seo and JsonLd components exist', exists('frontend/src/seo/Seo.tsx') && exists('frontend/src/seo/JsonLd.tsx'));
  check(
    'generated seo data is present',
    exists('frontend/src/seo/routes.json') && exists('frontend/src/seo/config.json'),
  );
  check('sitemap and robots generator exist', exists('frontend/scripts/generate-seo-files.mjs'));
  check('NotFound route exists', grep(/NotFound/, 'frontend/src', ['.tsx']).length > 0);
  check(
    'build emitted sitemap.xml and robots.txt',
    exists('frontend/dist/sitemap.xml') && exists('frontend/dist/robots.txt'),
  );
}
finish('06b');
