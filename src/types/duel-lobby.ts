import type { ApiError } from '@/types/api';
import type { FilterOptions } from '@/types/catalog';
import type {
  CoinFlipResult,
  DuelActor,
  DuelPlayer,
  DuelSession,
  FilterSubmission,
} from '@/types/duel';
import type { Filters } from '@/types/filters';

export type FilterSummaryLine = { label: string; value: string };

export type FilterSummary = FilterSummaryLine[];

export type DuelLobbyView =
  | { step: 'searching' }
  | { step: 'paired'; opponent: DuelPlayer }
  | {
      step: 'filters';
      yours: FilterSummary;
      submission: FilterSubmission;
      isLocking?: boolean;
    }
  | {
      step: 'coinFlip';
      winner: DuelActor;
      applied: FilterSummary;
      opponent: DuelPlayer;
    }
  | { step: 'noOpponent' };

export type DuelLobbyStep = DuelLobbyView['step'];

export type LobbyAction = 'cancel' | 'lock' | 'solo' | 'searchAgain';

export type DuelLobbyPhase =
  | 'connecting'
  | 'searching'
  | 'paired'
  | 'filters'
  | 'coinFlip'
  | 'ready'
  | 'noOpponent'
  | 'failed';

export type DuelLobbyFailureStep = 'connect' | 'queue' | 'lock' | 'match';

export type DuelLobbyFailure = { step: DuelLobbyFailureStep; error: ApiError };

export type DuelLobbyState = {
  phase: DuelLobbyPhase;
  // Read from the URL once the catalog loads
  filters: Filters | null;
  options: FilterOptions | null;
  opponent: DuelPlayer | null;
  submission: FilterSubmission;
  coinFlip: CoinFlipResult | null;
  session: DuelSession | null;
  isLocking: boolean;
  failure: DuelLobbyFailure | null;
};

export type DuelLobbyEvent =
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
  | { type: 'error'; error: ApiError }
  | { type: 'failed'; step: DuelLobbyFailureStep; error: ApiError };

export type DuelGateAction = 'leave' | 'retry';
