export const SOUND_STORAGE_KEY = 'lineup.sound';

const STORED = { on: 'on', off: 'off' } as const;

export type SoundStorage = Pick<Storage, 'getItem' | 'setItem'>;

// Blocked or empty storage means sound on
export function readMuted(storage: SoundStorage | null): boolean {
  try {
    return storage?.getItem(SOUND_STORAGE_KEY) === STORED.off;
  } catch {
    return false;
  }
}

export function writeMuted(
  storage: SoundStorage | null,
  isMuted: boolean,
): void {
  try {
    storage?.setItem(SOUND_STORAGE_KEY, isMuted ? STORED.off : STORED.on);
  } catch {
    // The choice still holds for this page
  }
}

function browserStorage(): SoundStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

let muted: boolean | null = null;
const listeners = new Set<() => void>();

export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMuted(): boolean {
  muted ??= readMuted(browserStorage());
  return muted;
}

export function setMuted(isMuted: boolean): void {
  muted = isMuted;
  writeMuted(browserStorage(), isMuted);
  listeners.forEach((listener) => listener());
}
