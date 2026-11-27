import { ExhaustiveChecks } from '../features/verify/ExhaustiveChecks';
import { KnownPlaintext } from '../features/verify/KnownPlaintext';
import { UnicityCurve } from '../features/verify/UnicityCurve';

export default function Verify() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 p-6 md:p-10">
      <title>Verify · Cipher Lab</title>
      <header>
        <h1 className="mb-2 text-2xl text-fg">Verify</h1>
        <p className="text-muted">Don&apos;t trust the cipher. Check it.</p>
      </header>
      <ExhaustiveChecks />
      <KnownPlaintext />
      <UnicityCurve />
    </div>
  );
}
