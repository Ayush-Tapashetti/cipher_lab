/** DIFF-001: the short proofs the cipher depends on, written out. */
export function Proofs() {
  return (
    <section aria-labelledby="proofs" className="flex max-w-prose flex-col gap-4">
      <h2 id="proofs" className="text-xl text-fg">
        Proofs
      </h2>
      <article>
        <h3 className="text-fg">Caesar decryption is correct</h3>
        <p className="text-sm text-muted">
          D(E(x)) = ((x + k) − k) mod 26 = x mod 26 = x, because x is already in 0..25. So decryption is just shifting
          by −k, which is the same as shifting by 26 − k.
        </p>
      </article>
      <article>
        <h3 className="text-fg">Affine needs gcd(a, 26) = 1</h3>
        <p className="text-sm text-muted">
          If gcd(a, 26) = 1, Bézout gives integers s, t with a·s + 26·t = 1, so a·s ≡ 1 (mod 26) and a⁻¹ = s mod 26.
          Then a⁻¹(ax + b − b) ≡ x. If gcd(a, 26) = d &gt; 1, then a·(26/d) ≡ 0 = a·0 (mod 26), so two different letters
          (0 and 26/d) encrypt to the same value and no decryption can exist.
        </p>
      </article>
      <article>
        <h3 className="text-fg">Counting keys</h3>
        <p className="text-sm text-muted">
          The units mod 26 are the numbers 1..25 not divisible by 2 or 13, giving φ(26) = φ(2)·φ(13) = 1 · 12 = 12. With
          26 choices of b the affine cipher has 12 · 26 = 312 keys, and a substitution key is a permutation of 26
          letters, so 26! of them.
        </p>
      </article>
    </section>
  );
}
