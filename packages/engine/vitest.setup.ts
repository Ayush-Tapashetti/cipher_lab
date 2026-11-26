import { beforeEach, vi } from 'vitest';

// Zero-network rule: the engine is pure, so any network call in a test is a bug.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('Unexpected network call in test');
    }),
  );
});
