import type { ApiError } from '@/types/api';
import type { GridPulse, ToastMessage } from '@/types/feedback';
import type {
  SoloGuessResponse,
  SoloMatchOffer,
  SoloSession,
  SoloSummary,
} from '@/types/solo';

export type SoloRunPhase =
  'finding' | 'choosing' | 'playing' | 'over' | 'failed';

export type SoloRunStep = 'find' | 'choose' | 'sync' | 'quit' | 'summary';

export type SoloRunFailure = { step: SoloRunStep; error: ApiError };

export type SoloRunState = {
  phase: SoloRunPhase;
  offer: SoloMatchOffer | null;
  session: SoloSession | null;
  summary: SoloSummary | null;
  isGuessing: boolean;
  isQuitting: boolean;
  // Server retry time after a rate-limited guess
  cooldownUntil: number | null;
  failure: SoloRunFailure | null;
  toast: ToastMessage | null;
  pulse?: GridPulse;
  shakeKey: number;
  lifeLostKey: number;
};

export type SoloRunEvent =
  | { type: 'finding' }
  | { type: 'offerReceived'; offer: SoloMatchOffer }
  | { type: 'sessionReceived'; session: SoloSession }
  | { type: 'guessSubmitted' }
  | { type: 'guessResolved'; response: SoloGuessResponse }
  | { type: 'guessFailed'; error: ApiError; at: number }
  | { type: 'cooldownEnded' }
  | { type: 'synced'; session: SoloSession }
  | { type: 'quitting' }
  // Tagged, so a late reply can't land on a new run
  | { type: 'summaryReceived'; sessionId: string; summary: SoloSummary }
  | { type: 'summaryFailed'; sessionId: string; error: ApiError }
  | { type: 'failed'; step: SoloRunStep; error: ApiError }
  | { type: 'retried' };

export type SoloGateAction = 'choose' | 'widen' | 'leave' | 'retry';
