import { describe, expect, it } from 'vitest';
import { countLetters, lastLetter, parseIntField, percent, showInt } from './text';

describe('text helpers', () => {
  it('lastLetter skips trailing spaces, digits and punctuation', () => {
    expect(lastLetter('Attack at dawn!! 123')).toBe('n');
    expect(lastLetter('123 !?')).toBeNull();
    expect(lastLetter('')).toBeNull();
  });

  it('countLetters counts A-Z only', () => {
    expect(countLetters('Hello, World 42')).toBe(10);
  });

  it('parseIntField and showInt round-trip, and an empty field is NaN (not 0)', () => {
    expect(parseIntField('  7 ')).toBe(7);
    expect(parseIntField('')).toBeNaN();
    expect(showInt(Number.NaN)).toBe('');
    expect(showInt(-3)).toBe('-3');
  });

  it('percent formats a share', () => {
    expect(percent(0.0817, 1)).toBe('8.2%');
    expect(percent(1 / 3, 2)).toBe('33.33%');
  });
});
