import type { GuessInputStatus } from '@/components/game/GuessInput';
import type { RingMode } from '@/types/countdown';
import type { DuelActor, DuelPlayer } from '@/types/duel';
import type { DuelLobbyView } from '@/types/duel-lobby';
import type { GridPulse, ToastMessage } from '@/types/feedback';
import type { Lives, RoundTiming } from '@/types/game';
import type { MaskedMatch } from '@/types/match';
import type { FoundPlayer } from '@/types/player';
import type { SoloSummary } from '@/types/solo';

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

export type SoloEndView =
  { status: 'loading' } | { status: 'ready'; summary: SoloSummary };

export type SoloCanvasView = CanvasViewBase & {
  mode: 'solo';
  lives: Lives;
  // Set once the run is over
  end: SoloEndView | null;
};

export type DuelCanvasView = CanvasViewBase & {
  mode: 'duel';
  you: DuelPlayer;
  // Null until pairing
  opponent: DuelPlayer | null;
  // Null until the first round
  turn: DuelActor | null;
  // Set while the duel is being arranged
  lobby: DuelLobbyView | null;
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
