import { AppLink } from '../components/ui/AppLink';

/** Catch-all for unknown paths. The real HTTP 404 status is the web server's job (Step 8). */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl p-6 md:p-10">
      <title>Page not found · Cipher Lab</title>
      <p className="text-sm text-amber">404</p>
      <h1 className="mt-1 mb-3 text-2xl text-fg">No such page</h1>
      <p className="mb-6 text-muted">That address does not exist here. These do:</p>
      <ul className="space-y-2">
        <li>
          <AppLink to="/" end className="text-cyan underline underline-offset-4">
            Workspace
          </AppLink>{' '}
          <span className="text-muted">type, encrypt, break</span>
        </li>
        <li>
          <AppLink to="/math-lab" className="text-cyan underline underline-offset-4">
            Math Lab
          </AppLink>{' '}
          <span className="text-muted">the arithmetic, in the open</span>
        </li>
        <li>
          <AppLink to="/verify" className="text-cyan underline underline-offset-4">
            Verify
          </AppLink>{' '}
          <span className="text-muted">check every key</span>
        </li>
      </ul>
    </div>
  );
}
