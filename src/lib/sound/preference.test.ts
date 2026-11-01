import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SOUND_STORAGE_KEY,
  type SoundStorage,
  getMuted,
  readMuted,
  setMuted,
  subscribeMuted,
  writeMuted,
} from '@/lib/sound/preference';

function memoryStorage(initial: Record<string, string> = {}): SoundStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const BLOCKED: SoundStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('readMuted', () => {
  it('is on with nothing stored', () => {
    expect(readMuted(memoryStorage())).toBe(false);
  });

  it('is on without storage at all', () => {
    expect(readMuted(null)).toBe(false);
  });

  it('is on when storage throws', () => {
    expect(readMuted(BLOCKED)).toBe(false);
  });

  it('reads a stored mute', () => {
    expect(readMuted(memoryStorage({ [SOUND_STORAGE_KEY]: 'off' }))).toBe(true);
    expect(readMuted(memoryStorage({ [SOUND_STORAGE_KEY]: 'on' }))).toBe(false);
  });

  it('ignores a value it never writes', () => {
    expect(readMuted(memoryStorage({ [SOUND_STORAGE_KEY]: 'true' }))).toBe(
      false,
    );
  });
});

describe('writeMuted', () => {
  it('round-trips through readMuted', () => {
    const storage = memoryStorage();
    writeMuted(storage, true);
    expect(readMuted(storage)).toBe(true);
    writeMuted(storage, false);
    expect(readMuted(storage)).toBe(false);
  });

  it('never throws on blocked storage', () => {
    expect(() => writeMuted(BLOCKED, true)).not.toThrow();
    expect(() => writeMuted(null, true)).not.toThrow();
  });
});

describe('mute store in a browser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // A fresh module is a page reload
  async function reload() {
    vi.resetModules();
    return import('@/lib/sound/preference');
  }

  it('keeps a mute across a reload', async () => {
    vi.stubGlobal('window', { localStorage: memoryStorage() });
    const first = await reload();
    expect(first.getMuted()).toBe(false);
    first.setMuted(true);

    const second = await reload();
    expect(second.getMuted()).toBe(true);
  });

  it('falls back to on when reaching storage throws', async () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('SecurityError');
      },
    });
    const store = await reload();
    expect(store.getMuted()).toBe(false);
    expect(() => store.setMuted(true)).not.toThrow();
    expect(store.getMuted()).toBe(true);
  });
});

describe('mute store', () => {
  // Node has no window, so this is the no-storage path
  it('starts on, and tells subscribers about a change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMuted(listener);
    expect(getMuted()).toBe(false);

    setMuted(true);
    expect(getMuted()).toBe(true);
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    setMuted(false);
    expect(listener).toHaveBeenCalledOnce();
    expect(getMuted()).toBe(false);
  });
});
