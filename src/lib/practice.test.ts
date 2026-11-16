import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearOpenRun,
  hasOpenRun,
  isPracticeFrom,
  markOpenRun,
  modeOf,
  modeOptionOf,
  withPractice,
} from '@/lib/practice';

describe('the mode cards', () => {
  it('shows practice only when the run is one', () => {
    expect(modeOptionOf('solo', true)).toBe('practice');
    expect(modeOptionOf('solo', false)).toBe('solo');
    expect(modeOptionOf('duel', false)).toBe('duel');
  });

  it('turns practice into a solo run', () => {
    expect(modeOf('practice')).toEqual({ mode: 'solo', practice: true });
  });

  it('clears practice for solo and duel', () => {
    expect(modeOf('solo')).toEqual({ mode: 'solo', practice: false });
    expect(modeOf('duel')).toEqual({ mode: 'duel', practice: false });
  });

  it('round-trips every card when practice is open', () => {
    for (const option of ['solo', 'duel', 'practice'] as const) {
      const { mode, practice } = modeOf(option);
      expect(modeOptionOf(mode, practice)).toBe(option);
    }
  });
});

describe('practice in the URL', () => {
  it('reads only practice=1', () => {
    expect(isPracticeFrom(new URLSearchParams('practice=1'))).toBe(true);
    expect(isPracticeFrom(new URLSearchParams('practice=0'))).toBe(false);
    expect(isPracticeFrom(new URLSearchParams())).toBe(false);
  });

  it('sets and drops it, keeping the rest', () => {
    const base = new URLSearchParams('club=c-1');
    const on = withPractice(base, true);
    expect(on.toString()).toBe('club=c-1&practice=1');
    expect(withPractice(on, false).toString()).toBe('club=c-1');
    expect(base.has('practice')).toBe(false);
  });
});

describe('the open timed run', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubStorage() {
    const store = new Map<string, string>();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
  }

  it('is marked by a timed run and cleared at its end', () => {
    stubStorage();
    expect(hasOpenRun()).toBe(false);
    markOpenRun('session-1');
    expect(hasOpenRun()).toBe(true);
    clearOpenRun();
    expect(hasOpenRun()).toBe(false);
  });

  it('never throws without storage: no warning instead', () => {
    vi.stubGlobal('window', {
      get sessionStorage(): Storage {
        throw new Error('blocked');
      },
    });
    expect(() => markOpenRun('session-1')).not.toThrow();
    expect(() => clearOpenRun()).not.toThrow();
    expect(hasOpenRun()).toBe(false);
  });
});
