import { AUTH_ERROR_MESSAGES } from '@/lib/auth';
import { SAMPLE_HISTORY_MATCHES } from '@/lib/dev/samples';
import type { ArchiveView } from '@/types/archive';
import type { MatchIdentity } from '@/types/match';

export const DEFAULT_ARCHIVE_STATE = 'open';

export type ArchiveState = {
  view: ArchiveView;
  // What the search box holds in the snapshot
  search: string;
};

const NEWEST_FIRST = [...SAMPLE_HISTORY_MATCHES].sort((a, b) =>
  a.date < b.date ? 1 : -1,
);

const [FIRST] = SAMPLE_HISTORY_MATCHES;

// Two-line names and a nickname, for 320px
const LONG_NAMES: MatchIdentity = {
  ...FIRST,
  id: 'long-1',
  home: { ...FIRST.home, name: 'Borussia Mönchengladbach', crestUrl: null },
  away: { ...FIRST.away, name: 'Wolverhampton Wanderers' },
  stage: 'Quarter-final second leg',
  nickname: 'The Night the Floodlights Failed at the Old Ground',
};

function view(overrides: Partial<ArchiveView>): ArchiveView {
  return {
    status: 'list',
    total: null,
    entries: [],
    more: 'end',
    isRefreshing: false,
    ...overrides,
  };
}

export const ARCHIVE_STATES: Record<string, ArchiveState> = {
  open: {
    search: '',
    view: view({ total: 1924, entries: NEWEST_FIRST, more: 'idle' }),
  },
  locked: { search: '', view: view({ status: 'locked' }) },
  pending: { search: '', view: view({ status: 'pending' }) },
  loading: { search: '', view: view({ status: 'loading' }) },
  empty: { search: 'zzz', view: view({ status: 'empty', total: 0 }) },
  error: {
    search: '',
    view: view({
      status: 'error',
      errorMessage: AUTH_ERROR_MESSAGES.network,
    }),
  },
  long: {
    search: 'borussia',
    view: view({ total: 2, entries: [LONG_NAMES, NEWEST_FIRST[0]] }),
  },
  refreshing: {
    search: 'nort',
    view: view({ total: 1924, entries: NEWEST_FIRST, isRefreshing: true }),
  },
};

export function resolveArchiveState(
  param: string | string[] | undefined,
): ArchiveState {
  const name =
    typeof param === 'string' && Object.hasOwn(ARCHIVE_STATES, param)
      ? param
      : DEFAULT_ARCHIVE_STATE;
  return ARCHIVE_STATES[name];
}
