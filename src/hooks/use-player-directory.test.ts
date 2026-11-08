import { describe, expect, it } from 'vitest';
import { needsDirectoryRecheck } from '@/hooks/use-player-directory';

describe('needsDirectoryRecheck', () => {
  it('leaves the first match to the mount fetch', () => {
    expect(needsDirectoryRecheck(null, 'session-1')).toBe(false);
  });

  it('checks again when a new match starts', () => {
    expect(needsDirectoryRecheck('session-1', 'session-2')).toBe(true);
  });

  it('does not check twice for the same match', () => {
    expect(needsDirectoryRecheck('session-1', 'session-1')).toBe(false);
  });

  // Between matches the key is null; that's no match
  it('ignores the gap between matches', () => {
    expect(needsDirectoryRecheck('session-1', null)).toBe(false);
  });
});
