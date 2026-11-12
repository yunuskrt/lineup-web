import type { GuessInputStatus } from '@/components/game/GuessInput';
import type { RingMode } from '@/types/countdown';
import type {
  ConnectionState,
  DuelActor,
  DuelPlayer,
  DuelResult,
} from '@/types/duel';
import type { DuelLobbyView } from '@/types/duel-lobby';
import type { GridPulse, ToastMessage } from '@/types/feedback';
import type { Lives, RoundTiming } from '@/types/game';
import type { MatchIdentity, MatchInPlay } from '@/types/match';
import type { FoundPlayer } from '@/types/player';
import type { ProAccess } from '@/types/pro';
import type { SoloSummary } from '@/types/solo';

export type CanvasMode = 'solo' | 'duel';

export type CanvasClock = {
  round: RoundTiming | null;
  isFrozen: boolean;
};

export type CanvasSidePick = {
  match: MatchIdentity;
  // The pick is in flight; the tiles read busy
  isChoosing: boolean;
};

export type CanvasGateCountdown = {
  deadline: number;
  // A rate limit's wait is on this device's clock
  clock?: 'server' | 'local';
  label: (secondsLeft: number) => string;
};

export type CanvasGateView = {
  title: string;
  detail?: string;
  actionLabel?: string;
  // A quieter way out, as a text link
  secondaryActionLabel?: string;
  // Replaces `detail` with a ticking countdown
  countdown?: CanvasGateCountdown;
  // The solo side pick, drawn as a match card
  sidePick?: CanvasSidePick;
};

export type CanvasViewBase = {
  // Null while the match is still loading
  match: MatchInPlay | null;
  found: FoundPlayer[];
  clock: CanvasClock;
  input: GuessInputStatus;
  // The server's retry time while input is `cooldown`
  cooldownUntil?: number;
  toast: ToastMessage | null;
  pulse?: GridPulse;
  shakeKey: number;
  lifeLostKey: number;
  gate: CanvasGateView | null;
};

export type SoloEndView =
  | { status: 'loading' }
  | { status: 'ready'; summary: SoloSummary; isMissedRevealed: boolean };

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
  // Set while the server reports them reconnecting
  opponentConnection: ConnectionState | null;
  // Set while the server reports you reconnecting
  yourConnection: ConnectionState | null;
  // Arrives whole with `finished`; no loading state
  end: DuelResult | null;
  endReason?: DuelEndReason;
  // A private room's game: New room, not Play again
  isPrivate?: boolean;
  // Hosting is Pro (R10); open when unset
  hostAccess?: ProAccess;
};

export type DuelEndReason = 'connectionLost';

export type CanvasView = SoloCanvasView | DuelCanvasView;

export type RingSetup = {
  round: RoundTiming;
  mode: RingMode;
};

export type ActiveRing = RingSetup & { owner: DuelActor };

export type ClockLabel = {
  text: string;
  // Null when the label names no one
  actor: DuelActor | null;
};

export type FoundCount = {
  label: string;
  spoken: string;
};
