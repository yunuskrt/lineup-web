import type { GuessInputStatus } from '@/components/game/GuessInput';
import type { RingMode } from '@/types/countdown';
import type { DuelActor, DuelPlayer } from '@/types/duel';
import type { GridPulse, ToastMessage } from '@/types/feedback';
import type { Lives, RoundTiming } from '@/types/game';
import type { MaskedMatch } from '@/types/match';
import type { FoundPlayer } from '@/types/player';

export type CanvasMode = 'solo' | 'duel';

export type CanvasClock = {
  round: RoundTiming | null;
  isFrozen: boolean;
};

export type CanvasGateChoice = { id: string; label: string };

export type CanvasGateView = {
  title: string;
  detail?: string;
  actionLabel?: string;
  // One decision across equal options
  choices?: CanvasGateChoice[];
};

export type CanvasViewBase = {
  // Null while the match is still loading
  match: MaskedMatch | null;
  found: FoundPlayer[];
  clock: CanvasClock;
  input: GuessInputStatus;
  toast: ToastMessage | null;
  pulse?: GridPulse;
  shakeKey: number;
  lifeLostKey: number;
  gate: CanvasGateView | null;
};

export type SoloCanvasView = CanvasViewBase & {
  mode: 'solo';
  lives: Lives;
};

export type DuelCanvasView = CanvasViewBase & {
  mode: 'duel';
  you: DuelPlayer;
  opponent: DuelPlayer;
  turn: DuelActor;
};

export type CanvasView = SoloCanvasView | DuelCanvasView;

export type RingSetup = {
  round: RoundTiming;
  mode: RingMode;
};

export type FoundCount = {
  label: string;
  spoken: string;
};
