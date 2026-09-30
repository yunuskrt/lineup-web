import type { Session } from '@/types/auth';
import type { HistoryEntry, HistoryPage, Profile } from '@/types/profile';

export type HistoryMoreState = 'idle' | 'loading' | 'failed' | 'end';

export type HistoryTone = 'win' | 'loss' | 'draw' | 'clear' | 'neutral';

export type ProfileScreenView =
  // The session loads first, so a guest strip holds its space
  | { status: 'loading'; isGuest: boolean }
  | { status: 'signedOut' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      profile: Profile;
      history: HistoryEntry[];
      more: HistoryMoreState;
    };

export type DuelRecord = {
  wins: number;
  draws: number;
  losses: number;
  total: number;
};

export type RecordShares = {
  wins: number;
  draws: number;
  losses: number;
};

// The query fields the screen reads, not TanStack's types
type QueryState<T> = {
  data: T | undefined;
  error: unknown;
  isPending: boolean;
};

export type ProfileScreenInput = {
  session: QueryState<Session | null>;
  profile: QueryState<Profile>;
  history: QueryState<HistoryPage[]> & {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isFetchNextPageError: boolean;
  };
};
