import { describe, expect, it } from 'vitest';
import { matchIdentitySchema } from '@/lib/api/schemas/match';
import {
  ARCHIVE_STATES,
  DEFAULT_ARCHIVE_STATE,
  resolveArchiveState,
} from '@/lib/dev/archive-states';

describe('archive snapshots', () => {
  it('cover every state the page can be in', () => {
    const statuses = new Set(
      Object.values(ARCHIVE_STATES).map((state) => state.view.status),
    );
    expect([...statuses].sort()).toEqual(
      ['empty', 'error', 'list', 'loading', 'locked', 'pending'].sort(),
    );
  });

  it('only list matches the backend could send', () => {
    for (const [name, state] of Object.entries(ARCHIVE_STATES)) {
      for (const match of state.view.entries) {
        expect(matchIdentitySchema.safeParse(match).success, name).toBe(true);
      }
    }
  });

  it('show long names and a nickname in the long snapshot', () => {
    const [long] = ARCHIVE_STATES.long.view.entries;
    expect(long.home.name.length).toBeGreaterThan(20);
    expect(long.nickname?.length).toBeGreaterThan(40);
  });

  it('carry a total wherever rows show', () => {
    for (const [name, state] of Object.entries(ARCHIVE_STATES)) {
      if (state.view.status === 'list') {
        expect(state.view.total, name).not.toBeNull();
      }
    }
  });

  it('fall back to the default for an unknown name', () => {
    expect(resolveArchiveState('nope')).toBe(
      ARCHIVE_STATES[DEFAULT_ARCHIVE_STATE],
    );
    expect(resolveArchiveState(['locked'])).toBe(
      ARCHIVE_STATES[DEFAULT_ARCHIVE_STATE],
    );
    expect(resolveArchiveState('locked')).toBe(ARCHIVE_STATES.locked);
  });
});
