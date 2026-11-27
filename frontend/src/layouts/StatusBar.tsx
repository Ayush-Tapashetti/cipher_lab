import { runExhaustiveChecks } from '@cipher-lab/engine';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { useUi } from '../state/store';

/**
 * Persistent footer: the learning-tool disclaimer, the privacy note, and the engine's own self-check
 * (every Caesar and affine key round-trips) so the page proves its maths is wired up.
 */
export function StatusBar() {
  const layout = useUi((s) => s.layout);
  const report = useMemo(() => runExhaustiveChecks(), []);
  const ok = report.allPassed;

  return (
    <footer className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-line bg-surface px-4 py-2 text-xs text-muted">
      <p
        role={ok ? 'status' : 'alert'}
        className={ok ? 'inline-flex items-center gap-1.5 text-emerald' : 'inline-flex items-center gap-1.5 text-amber'}
      >
        {ok ? (
          <CircleCheck aria-hidden="true" className="size-4" />
        ) : (
          <TriangleAlert aria-hidden="true" className="size-4" />
        )}
        <span>
          engine self-check {report.passed}/{report.total}
          {ok ? '' : ' (some checks failed)'}
        </span>
      </p>
      <p>layout: {layout}</p>
      <p className="md:ml-auto">
        Learning tool: classical ciphers are breakable by design. Never protect real secrets with them. Your text stays
        in this tab; nothing is sent or stored.
      </p>
    </footer>
  );
}
