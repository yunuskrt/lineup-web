import type { ApiError, ApiResult } from '@/types/api';
import type {
  CoinFlipResult,
  ConnectionState,
  DuelFoundPlayer,
  DuelGuessRequest,
  DuelLifeLost,
  DuelResult,
  DuelSession,
  FilterSubmission,
  PairedState,
  QueueState,
  QueueTimeout,
} from '@/types/duel';
import type { Filters } from '@/types/filters';
import type { GuessResult } from '@/types/game';

// Only `matchReady`/`roundStarted` are authoritative
export type DuelEventMap = {
  queued: QueueState;
  queueTimedOut: QueueTimeout;
  paired: PairedState;
  filtersUpdated: FilterSubmission;
  coinFlip: CoinFlipResult;
  matchReady: DuelSession;
  roundStarted: DuelSession;
  guessResolved: GuessResult;
  playerRevealed: DuelFoundPlayer;
  lifeLost: DuelLifeLost;
  turnChanged: DuelSession;
  opponentConnection: ConnectionState;
  finished: DuelResult;
  disconnected: ConnectionState;
  error: ApiError;
};

export type DuelEvent = keyof DuelEventMap;

export type DuelEventHandler<E extends DuelEvent> = (
  payload: DuelEventMap[E],
) => void;

export type Unsubscribe = () => void;

// Transport only; the server sends your return
export type ConnectionChange = 'dropped' | 'restored';

export interface DuelClient {
  connect(): Promise<ApiResult<void>>;
  disconnect(): void;
  enterQueue(): Promise<ApiResult<void>>;
  leaveQueue(): Promise<ApiResult<void>>;
  submitFilters(filters: Filters): Promise<ApiResult<void>>;
  // Acks receipt; the outcome comes as `guessResolved`
  guess(request: DuelGuessRequest): Promise<ApiResult<void>>;
  forfeit(): Promise<ApiResult<void>>;
  on<E extends DuelEvent>(event: E, handler: DuelEventHandler<E>): Unsubscribe;
  // Ended for good; never reopens by itself
  onClose(handler: (error: ApiError) => void): Unsubscribe;
  // A drop being retried, then the reconnect
  onConnection(handler: (change: ConnectionChange) => void): Unsubscribe;
}

let registeredClient: DuelClient | null = null;

export function setDuelClient(client: DuelClient): void {
  registeredClient = client;
}

export function getDuelClient(): DuelClient {
  if (!registeredClient) {
    throw new Error(
      'No duel client registered. Call setDuelClient() during app bootstrap.',
    );
  }

  return registeredClient;
}
