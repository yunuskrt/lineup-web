import type { ApiError } from '@/types/api';
import type { FilterOptions } from '@/types/catalog';
import type {
  CoinFlipResult,
  ConnectionState,
  DuelLifeLost,
  DuelPlayer,
  DuelResult,
  DuelSession,
  FilterSubmission,
} from '@/types/duel';
import type { GridPulse, ToastMessage } from '@/types/feedback';
import type { Filters } from '@/types/filters';
import type { GuessResult } from '@/types/game';

export type DuelSessionPhase =
  | 'connecting'
  | 'searching'
  | 'paired'
  | 'filters'
  | 'coinFlip'
  | 'playing'
  | 'finished'
  | 'noOpponent'
  | 'failed';

export type DuelFailureStep =
  'connect' | 'queue' | 'lock' | 'match' | 'forfeit';

export type DuelFailure = { step: DuelFailureStep; error: ApiError };

export type DuelSessionState = {
  phase: DuelSessionPhase;
  // Read from the URL once the catalog loads
  filters: Filters | null;
  options: FilterOptions | null;
  opponent: DuelPlayer | null;
  submission: FilterSubmission;
  coinFlip: CoinFlipResult | null;
  session: DuelSession | null;
  result: DuelResult | null;
  opponentConnection: ConnectionState | null;
  isLocking: boolean;
  isGuessing: boolean;
  isForfeiting: boolean;
  failure: DuelFailure | null;
  toast: ToastMessage | null;
  pulse?: GridPulse;
  shakeKey: number;
  lifeLostKey: number;
  // Bumps when a verdict says to clear the input
  clearKey: number;
};

export type DuelSessionEvent =
  | { type: 'started' }
  | { type: 'prepared'; filters: Filters; options: FilterOptions }
  | { type: 'queued' }
  | { type: 'queueTimedOut' }
  | { type: 'paired'; opponent: DuelPlayer }
  | { type: 'filtersOpened' }
  | { type: 'filtersUpdated'; submission: FilterSubmission }
  | { type: 'locking' }
  | { type: 'coinFlip'; result: CoinFlipResult }
  | { type: 'matchReady'; session: DuelSession }
  // Only these three carry state (W05b)
  | { type: 'roundStarted'; session: DuelSession }
  | { type: 'turnChanged'; session: DuelSession }
  | { type: 'guessSubmitted' }
  | { type: 'guessResolved'; result: GuessResult }
  | { type: 'guessFailed'; error: ApiError }
  | { type: 'lifeLost'; cue: DuelLifeLost }
  | { type: 'opponentConnection'; connection: ConnectionState }
  | { type: 'forfeiting' }
  | { type: 'finished'; result: DuelResult }
  | { type: 'error'; error: ApiError }
  | { type: 'failed'; step: DuelFailureStep; error: ApiError };

export type DuelGateAction = 'leave' | 'retry';
