import type { HistoryEntry, Profile } from '@/types/profile';

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
