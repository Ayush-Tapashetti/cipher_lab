import { beforeEach, vi } from 'vitest';

// Zero-network rule: nothing in the app may call the network, so any fetch in a test is a bug.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('Unexpected network call in test');
    }),
  );
});
