import type { ApiError } from '@/types/api';
import type { GridPulse, ToastMessage } from '@/types/feedback';
import type {
  SoloGuessResponse,
  SoloMatchOffer,
  SoloSession,
} from '@/types/solo';

export type SoloRunPhase =
  'finding' | 'choosing' | 'playing' | 'over' | 'failed';

export type SoloRunStep = 'find' | 'choose' | 'sync' | 'quit';

export type SoloRunFailure = { step: SoloRunStep; error: ApiError };

export type SoloRunState = {
  phase: SoloRunPhase;
  offer: SoloMatchOffer | null;
  session: SoloSession | null;
  isGuessing: boolean;
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
  | { type: 'guessFailed'; error: ApiError }
  | { type: 'synced'; session: SoloSession }
  | { type: 'failed'; step: SoloRunStep; error: ApiError }
  | { type: 'retried' };

export type SoloGateAction = 'choose' | 'leave' | 'retry';
