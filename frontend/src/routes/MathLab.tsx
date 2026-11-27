import { GroupExplorer } from '../features/mathlab/GroupExplorer';
import { KeySpace } from '../features/mathlab/KeySpace';
import { Proofs } from '../features/mathlab/Proofs';
import { UnitsTable } from '../features/mathlab/UnitsTable';

export default function MathLab() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 p-6 md:p-10">
      <title>Math Lab · Cipher Lab</title>
      <header>
        <h1 className="mb-2 text-2xl text-fg">Math Lab</h1>
        <p className="text-muted">The arithmetic behind the ciphers, in the open.</p>
      </header>
      <KeySpace />
      <UnitsTable />
      <GroupExplorer />
      <Proofs />
    </div>
  );
}
