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
  | 'failed'
  // The server turned this build away
  | 'refused';

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
  // Set while the server reports you reconnecting
  yourConnection: ConnectionState | null;
  // Your forfeit came from a dropped connection
  isConnectionLost: boolean;
  isLocking: boolean;
  isGuessing: boolean;
  isForfeiting: boolean;
  // Server retry time after a rate-limited guess
  cooldownUntil: number | null;
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
  | { type: 'guessFailed'; error: ApiError; at: number }
  | { type: 'cooldownEnded' }
  | { type: 'lifeLost'; cue: DuelLifeLost }
  | { type: 'opponentConnection'; connection: ConnectionState }
  | { type: 'disconnected'; connection: ConnectionState }
  | { type: 'forfeiting' }
  | { type: 'finished'; result: DuelResult }
  | { type: 'error'; error: ApiError; at: number }
  // Your own set, widened after an empty pool
  | { type: 'filtersWidened'; filters: Filters }
  | { type: 'failed'; step: DuelFailureStep; error: ApiError };

export type DuelGateAction = 'widen' | 'leave' | 'retry';
