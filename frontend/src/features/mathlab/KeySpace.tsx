import { ENGLISH_REDUNDANCY_BITS_PER_LETTER, keySpaceBits, keySpaceSize, unicityDistance } from '@cipher-lab/engine';
import type { CipherType } from '@cipher-lab/engine';

const ROWS: ReadonlyArray<{ id: CipherType; name: string; why: string }> = [
  { id: 'caesar', name: 'Caesar', why: 'one shift k in Z26' },
  { id: 'affine', name: 'Affine', why: 'φ(26) = 12 units × 26 shifts' },
  { id: 'substitution', name: 'Substitution', why: 'every permutation of 26 letters' },
];

/** FEAT-005: how many keys each cipher has, in bits, and how much ciphertext it takes to pin the key down. */
export function KeySpace() {
  return (
    <section aria-labelledby="keyspace" className="flex flex-col gap-3">
      <h2 id="keyspace" className="text-xl text-fg">
        Key space
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Number of keys, bits and unicity distance per cipher</caption>
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="py-1">
                Cipher
              </th>
              <th scope="col">Keys</th>
              <th scope="col">Bits</th>
              <th scope="col">Unicity distance</th>
              <th scope="col">Why</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const bits = keySpaceBits(r.id);
              return (
                <tr key={r.id} className="border-t border-line align-top">
                  <th scope="row" className="py-2 font-normal text-cyan">
                    {r.name}
                  </th>
                  <td className="break-all pr-3">{keySpaceSize(r.id).toString()}</td>
                  <td className="pr-3">{bits.toFixed(1)}</td>
                  <td className="pr-3">
                    {unicityDistance(bits, ENGLISH_REDUNDANCY_BITS_PER_LETTER).toFixed(1)} letters
                  </td>
                  <td className="text-muted">{r.why}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="max-w-prose text-sm text-muted">
        Unicity distance = (bits of key) / (bits of redundancy per letter, about {ENGLISH_REDUNDANCY_BITS_PER_LETTER}).
        With fewer letters than that, several keys can decrypt to plausible English; with more, usually only one can.
        Substitution has 26! keys, so searching them is hopeless, but frequency analysis still breaks it.
      </p>
    </section>
  );
}
