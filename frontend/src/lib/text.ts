import { letterCounts, totalLetters } from '@cipher-lab/engine';

/** The last A-Z letter in `text` (so the wheel follows the letter you just typed), or null. */
export function lastLetter(text: string): string | null {
  for (let i = text.length - 1; i >= 0; i -= 1) {
    const ch = text.charAt(i);
    if (/[A-Za-z]/.test(ch)) return ch;
  }
  return null;
}

export function countLetters(text: string): number {
  return totalLetters(letterCounts(text));
}

export function parseIntField(raw: string): number {
  return raw.trim() === '' ? Number.NaN : Number(raw);
}

export function showInt(value: number): string {
  return Number.isNaN(value) ? '' : String(value);
}

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}
