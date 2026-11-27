/** Joins class names, skipping falsy values. */
export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter((p): p is string => typeof p === 'string' && p !== '').join(' ');
}
