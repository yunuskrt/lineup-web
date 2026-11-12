import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@/lib/api/unwrap';
import {
  activeFiltersLabel,
  archiveDateLabel,
  archiveParams,
  archiveQueryFromParams,
  archiveQueryOf,
  archiveSearchFrom,
  archiveTotalLine,
  archiveView,
  pickedMatchFrom,
  pickedMatchPath,
  playMatchLabel,
  soloStartRequestOf,
  withOneClub,
  withoutPickedMatch,
} from '@/lib/archive';
import {
  SAMPLE_FILTER_OPTIONS as OPTIONS,
  SAMPLE_HISTORY_MATCHES,
} from '@/lib/dev/samples';
import { filtersFromParams } from '@/lib/filters';
import { matchEvent } from '@/lib/summary';
import type { ArchivePage } from '@/types/catalog';
import type { Filters } from '@/types/filters';
import type { MatchIdentity } from '@/types/match';

const ALL = filtersFromParams(new URLSearchParams(), OPTIONS);
const [COMPETITION] = OPTIONS.competitions;
const [CLUB_A, CLUB_B] = OPTIONS.clubs;

describe('archive URL', () => {
  it('round-trips the search and the filters', () => {
    const filters: Filters = filtersFromParams(
      new URLSearchParams({ competition: COMPETITION.id, club: CLUB_A.id }),
      OPTIONS,
    );
    const params = archiveParams('  milan 2005 ', filters, OPTIONS);
    expect(archiveSearchFrom(params)).toBe('milan 2005');
    expect(filtersFromParams(params, OPTIONS)).toEqual(filters);
    expect(archiveQueryFromParams(params, OPTIONS)).toEqual(
      archiveQueryOf('milan 2005', filters),
    );
  });

  it('leaves an empty search out of the URL', () => {
    expect(archiveParams('   ', ALL, OPTIONS).has('q')).toBe(false);
    expect(archiveSearchFrom(new URLSearchParams())).toBe('');
  });

  it('cuts a search past 64 characters', () => {
    const long = new URLSearchParams({ q: 'a'.repeat(80) });
    expect(archiveSearchFrom(long)).toHaveLength(64);
  });
});

describe('archiveQueryOf', () => {
  it('sends the era always and the search when set', () => {
    expect(archiveQueryOf('', ALL)).toEqual({
      from: ALL.era.from,
      to: ALL.era.to,
    });
    expect(archiveQueryOf(' istanbul ', ALL).q).toBe('istanbul');
  });

  it('sends one competition and one club, never several', () => {
    const one = archiveQueryOf('', {
      ...ALL,
      competitionIds: [COMPETITION.id],
      clubIds: [CLUB_A.id],
    });
    expect(one).toMatchObject({
      competitionId: COMPETITION.id,
      clubId: CLUB_A.id,
    });
    const two = archiveQueryOf('', { ...ALL, clubIds: [CLUB_A.id, CLUB_B.id] });
    expect(two.clubId).toBeUndefined();
  });
});

describe('withOneClub', () => {
  it('keeps only the newest club picked', () => {
    const previous = { ...ALL, clubIds: [CLUB_A.id] };
    const next = { ...ALL, clubIds: [CLUB_A.id, CLUB_B.id] };
    expect(withOneClub(previous, next).clubIds).toEqual([CLUB_B.id]);
  });

  it('leaves a single club or none alone', () => {
    const next = { ...ALL, clubIds: [CLUB_A.id] };
    expect(withOneClub(ALL, next)).toBe(next);
    expect(withOneClub(next, ALL)).toBe(ALL);
  });
});

describe('activeFiltersLabel', () => {
  it('is null with every filter on Any', () => {
    expect(activeFiltersLabel(ALL, OPTIONS)).toBeNull();
  });

  it('names what is picked', () => {
    const picked = { ...ALL, clubIds: [CLUB_A.id] };
    expect(activeFiltersLabel(picked, OPTIONS)).toBe(CLUB_A.name);
  });
});

describe('archive labels', () => {
  it('counts the matches, singular too', () => {
    expect(archiveTotalLine(1924)).toBe(
      '1,924 matches. Search by club, competition, season or nickname.',
    );
    expect(archiveTotalLine(1)).toMatch(/^1 match\./);
  });

  it('writes the date short, in UTC', () => {
    expect(archiveDateLabel('2005-05-25')).toBe('25 May 2005');
    expect(archiveDateLabel('2014-10-22')).toBe('22 Oct 2014');
  });

  it('joins the competition and the stage', () => {
    const match: MatchIdentity = SAMPLE_HISTORY_MATCHES[0];
    expect(matchEvent(match)).toBe(`${match.competition.name} semi-final`);
    expect(matchEvent({ ...match, stage: null })).toBe(match.competition.name);
  });
});

describe('archiveView', () => {
  const PAGE: ArchivePage = {
    entries: SAMPLE_HISTORY_MATCHES.slice(0, 2),
    nextCursor: 'h-2',
    total: 8,
  };
  const BASE = {
    access: 'open' as const,
    options: { isError: false, error: null, hasData: true },
    pages: undefined,
    isError: false,
    error: null,
    isPlaceholderData: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    hasNextPage: false,
  };

  it('waits for the tier, and never lists while locked', () => {
    expect(archiveView({ ...BASE, access: 'pending' }).status).toBe('pending');
    const locked = archiveView({ ...BASE, access: 'locked', pages: [PAGE] });
    expect(locked.status).toBe('locked');
    expect(locked.entries).toEqual([]);
  });

  it('loads, lists and pages', () => {
    expect(archiveView(BASE).status).toBe('loading');
    const view = archiveView({ ...BASE, pages: [PAGE], hasNextPage: true });
    expect(view).toMatchObject({ status: 'list', total: 8, more: 'idle' });
    expect(view.entries).toHaveLength(2);
    expect(archiveView({ ...BASE, pages: [PAGE] }).more).toBe('end');
  });

  it('says empty when nothing matches', () => {
    const none = { ...PAGE, entries: [], nextCursor: null, total: 0 };
    expect(archiveView({ ...BASE, pages: [none] }).status).toBe('empty');
  });

  it('shows the server message on a failure', () => {
    const error = new ApiRequestError({
      code: 'invalid_input',
      message: 'That search is not valid.',
      retryAfterMs: null,
    });
    const view = archiveView({ ...BASE, isError: true, error });
    expect(view.status).toBe('error');
    expect(view.errorMessage).toBeTruthy();
  });

  it('fails when the filter options never loaded', () => {
    const error = new ApiRequestError({
      code: 'network',
      message: 'offline',
      retryAfterMs: null,
    });
    const view = archiveView({
      ...BASE,
      options: { isError: true, error, hasData: false },
    });
    expect(view.status).toBe('error');
    expect(view.errorMessage).toMatch(/connection/i);
  });

  it('keeps the list when only an options refetch failed', () => {
    const view = archiveView({
      ...BASE,
      options: { isError: true, error: null, hasData: true },
      pages: [PAGE],
    });
    expect(view.status).toBe('list');
  });

  it('keeps the list when only the next page failed', () => {
    const view = archiveView({
      ...BASE,
      pages: [PAGE],
      isError: true,
      isFetchNextPageError: true,
    });
    expect(view).toMatchObject({ status: 'list', more: 'failed' });
  });

  it('marks an older page shown while a search loads', () => {
    const view = archiveView({
      ...BASE,
      pages: [PAGE],
      isPlaceholderData: true,
    });
    expect(view.isRefreshing).toBe(true);
  });
});

describe('picked match', () => {
  it('links a row to its own run and reads it back', () => {
    const path = pickedMatchPath('match-1');
    expect(path).toBe('/play/solo?match=match-1');
    const params = new URLSearchParams(path.split('?')[1]);
    expect(pickedMatchFrom(params)).toBe('match-1');
    expect(pickedMatchFrom(new URLSearchParams())).toBeNull();
    expect(pickedMatchFrom(new URLSearchParams({ match: '  ' }))).toBeNull();
  });

  it('asks for practice only when ticked', () => {
    expect(soloStartRequestOf(ALL, { practice: true })).toEqual({
      ...ALL,
      practice: true,
    });
    expect(soloStartRequestOf(ALL, { matchId: 'm-1', practice: true })).toEqual(
      { ...ALL, matchId: 'm-1', practice: true },
    );
    expect(soloStartRequestOf(ALL, { practice: false })).toEqual(ALL);
    expect(pickedMatchPath('m-1', true)).toBe(
      '/play/solo?match=m-1&practice=1',
    );
  });

  it('adds the match to the filters only when picked', () => {
    expect(soloStartRequestOf(ALL)).toEqual(ALL);
    expect(soloStartRequestOf(ALL, { matchId: 'match-1' })).toEqual({
      ...ALL,
      matchId: 'match-1',
    });
  });

  it('drops the pick on the way back, keeping the filters', () => {
    const params = new URLSearchParams({ match: 'match-1', club: 'c-1' });
    const next = withoutPickedMatch(params);
    expect(next.has('match')).toBe(false);
    expect(next.get('club')).toBe('c-1');
    expect(params.has('match')).toBe(true);
  });

  it('names the match in each Play and Practise button', () => {
    const match = SAMPLE_HISTORY_MATCHES[0];
    expect(playMatchLabel(match)).toBe(
      `Play ${match.home.name} v ${match.away.name}, 3 May 2005`,
    );
    expect(playMatchLabel(match, 'Practise')).toMatch(/^Practise /);
  });
});
