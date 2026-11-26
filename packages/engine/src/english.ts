/**
 * Relative letter frequencies of English text, in percent, A..Z. These are the widely quoted values from
 * R. Lewand, "Cryptological Mathematics" (2000), as tabulated on the "Letter frequency" Wikipedia page.
 */
const ENGLISH_PERCENT: readonly number[] = [
  8.167, 1.492, 2.782, 4.253, 12.702, 2.228, 2.015, 6.094, 6.966, 0.153, 0.772, 4.025, 2.406, 6.749, 7.507, 1.929,
  0.095, 5.987, 6.327, 9.056, 2.758, 0.978, 2.36, 0.15, 1.974, 0.074,
];

const SUM = ENGLISH_PERCENT.reduce((a, b) => a + b, 0);

/** The table above divided by its own sum so it totals exactly 1 (the published values add to 100.0 only roughly). */
export const ENGLISH_FREQ: readonly number[] = ENGLISH_PERCENT.map((p) => p / SUM);

/** Expected index of coincidence of English: Σ p_i². */
export const ENGLISH_IC: number = ENGLISH_FREQ.reduce((sum, p) => sum + p * p, 0);
