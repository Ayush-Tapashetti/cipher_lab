const UPPER_A = 65;
const LOWER_A = 97;

/** Letter counts A..Z, case-insensitive; everything else is ignored. */
export function letterCounts(text: string): number[] {
  const counts = new Array<number>(26).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code >= UPPER_A && code < UPPER_A + 26) counts[code - UPPER_A] = (counts[code - UPPER_A] ?? 0) + 1;
    else if (code >= LOWER_A && code < LOWER_A + 26) counts[code - LOWER_A] = (counts[code - LOWER_A] ?? 0) + 1;
  }
  return counts;
}

export function totalLetters(counts: readonly number[]): number {
  return counts.reduce((sum, c) => sum + c, 0);
}

/** counts / total. All zeros (never NaN) when there are no letters. Sums to 1 within 1e-9 otherwise. */
export function relativeFrequencies(counts: readonly number[]): number[] {
  const total = totalLetters(counts);
  if (total === 0) return counts.map(() => 0);
  return counts.map((c) => c / total);
}

/** Σ n_i (n_i − 1) / (N (N − 1)). About 0.0667 for English, about 0.0385 for random letters. Null when N < 2. */
export function indexOfCoincidence(counts: readonly number[]): number | null {
  const total = totalLetters(counts);
  if (total < 2) return null;
  const pairs = counts.reduce((sum, c) => sum + c * (c - 1), 0);
  return pairs / (total * (total - 1));
}
