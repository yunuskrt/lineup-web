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

export type SoloRunStep =
  'find' | 'choose' | 'guess' | 'sync' | 'quit' | 'summary';

export type SoloRunFailure = { step: SoloRunStep; error: ApiError };

export type SoloRunState = {
  phase: SoloRunPhase;
  offer: SoloMatchOffer | null;
  session: SoloSession | null;
  summary: SoloSummary | null;
  isGuessing: boolean;
  isChoosing: boolean;
  // The player asked to see the missed XI
  isMissedRevealed: boolean;
  isQuitting: boolean;
  // Server retry time after a rate-limited guess
  cooldownUntil: number | null;
  failure: SoloRunFailure | null;
  // Set when the run plays an archive match
  pickedMatchId: string | null;
  toast: ToastMessage | null;
  pulse?: GridPulse;
  shakeKey: number;
  lifeLostKey: number;
};

export type SoloRunEvent =
  | { type: 'finding'; matchId: string | null }
  | { type: 'offerReceived'; offer: SoloMatchOffer }
  | { type: 'sideChosen' }
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
  | { type: 'missedRevealed' }
  | { type: 'failed'; step: SoloRunStep; error: ApiError }
  | { type: 'retried' };

export type SoloGateAction =
  'choose' | 'widen' | 'leave' | 'retry' | 'playDuel' | 'backToArchive';
