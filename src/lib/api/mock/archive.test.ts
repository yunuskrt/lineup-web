import { describe, expect, it } from 'vitest';
import {
  archivePageOf,
  archiveWords,
  matchesSearch,
  STALE_ARCHIVE_CURSOR,
} from '@/lib/api/mock/archive';
import { requireFixture } from '@/lib/api/mock/data/fixtures';
import { PLAYABLE_FIXTURES } from '@/lib/api/mock/pool';
import { MOCK_SHOWCASE } from '@/lib/api/mock/showcase';
import { archivePageSchema } from '@/lib/api/schemas/catalog';
import type { ApiResult } from '@/types/api';
import type { ArchivePage, ArchiveQuery } from '@/types/catalog';

function page(query: ArchiveQuery = {}): ArchivePage {
  const result = archivePageOf(query);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

function ids(query: ArchiveQuery = {}): string[] {
  return page(query).entries.map((match) => match.id);
}

function errorOf(result: ApiResult<ArchivePage>) {
  if (result.success) throw new Error('Expected a failure');
  return result.error;
}

describe('the mock archive', () => {
  it('lists the playable pool, newest first, never the showcase', () => {
    const all = page({ limit: 50 });
    expect(all.total).toBe(PLAYABLE_FIXTURES.length);
    expect(all.entries.map((m) => m.id)).not.toContain(MOCK_SHOWCASE.fixtureId);
    const dates = all.entries.map((m) => m.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(archivePageSchema.safeParse(all).success).toBe(true);
  });

  it('finds a club with or without its accents', () => {
    expect(ids({ q: 'atletico' })).toEqual([
      'match-meridiana-2024',
      'match-meridiana-2010',
    ]);
    expect(ids({ q: 'Atlético' })).toEqual(ids({ q: 'atletico' }));
  });

  it('folds Turkish letters as guesses do', () => {
    expect(ids({ q: 'yildirim' })).toEqual(['match-federation-2012-final']);
    expect(ids({ q: 'YILDIRIMSPOR' })).toEqual(['match-federation-2012-final']);
  });

  it('needs every word, each starting a word of the match', () => {
    expect(ids({ q: 'north' })).toEqual([
      'match-crown-2015',
      'match-continental-2005-final',
      'match-crown-2003',
    ]);
    expect(ids({ q: 'northgate 2005' })).toEqual([
      'match-continental-2005-final',
    ]);
    // "gate" sits inside Northgate, not at a start
    expect(page({ q: 'gate' }).total).toBe(0);
  });

  it('matches seasons and the year, never a nickname', () => {
    // Backend R15: nicknames are shown, not searched
    expect(page({ q: 'mudbath' }).total).toBe(0);
    expect(page({ q: 'rain' }).total).toBe(0);
    // 2004-05 answers to 2004 and to 2005
    expect(ids({ q: '2004' })).toEqual(['match-continental-2005-final']);
    expect(ids({ q: '2003' })).toEqual(['match-crown-2003']);
  });

  it('filters nothing on a search of punctuation only', () => {
    expect(page({ q: '!!' }).total).toBe(PLAYABLE_FIXTURES.length);
  });

  it('applies each filter, and all of them together', () => {
    expect(ids({ competitionId: 'comp-crown-league' })).toEqual([
      'match-crown-2015',
      'match-crown-2003',
    ]);
    expect(page({ clubId: 'club-northgate' }).total).toBe(3);
    expect(ids({ from: 2010, to: 2015 })).toEqual([
      'match-crown-2015',
      'match-championship-2012-group',
      'match-federation-2012-final',
    ]);
    expect(
      ids({ q: 'crown', clubId: 'club-northgate', from: 2003, to: 2025 }),
    ).toEqual(['match-crown-2015']);
  });

  it('pages with the cursor, with no repeats or gaps', () => {
    const first = page({ limit: 4 });
    const second = page({ limit: 4, cursor: first.nextCursor ?? '' });
    const third = page({ limit: 4, cursor: second.nextCursor ?? '' });
    const seen = [...first.entries, ...second.entries, ...third.entries].map(
      (m) => m.id,
    );
    expect(seen).toEqual(ids({ limit: 50 }));
    expect(new Set(seen).size).toBe(seen.length);
    expect(third.nextCursor).toBeNull();
    expect([first.total, second.total, third.total]).toEqual([9, 9, 9]);
  });

  it('refuses a cursor it never issued, and a bad query', () => {
    expect(errorOf(archivePageOf({ cursor: 'nope' }))).toMatchObject({
      code: 'invalid_input',
      message: STALE_ARCHIVE_CURSOR,
    });
    expect(errorOf(archivePageOf({ limit: 0 })).code).toBe('invalid_input');
    expect(errorOf(archivePageOf({ from: 2010, to: 2005 })).code).toBe(
      'invalid_input',
    );
  });
});

describe('archiveWords', () => {
  it('splits clubs, competition, season and year', () => {
    const words = archiveWords(requireFixture('match-crown-2003').identity);
    expect(words).toEqual(
      expect.arrayContaining(['northgate', 'crown', '2002', '2003']),
    );
    expect(words).not.toContain('mudbath');
  });

  it('never matches inside a word', () => {
    const match = requireFixture('match-crown-2003').identity;
    expect(matchesSearch(match, 'gate')).toBe(false);
    expect(matchesSearch(match, 'north crown')).toBe(true);
  });
});
