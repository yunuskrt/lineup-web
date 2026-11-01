import { ROUND_MS } from '@/lib/canvas';
import {
  FINAL_BEEP_FROM,
  OPPONENT_TICK_GAIN,
  SOUND_CUES,
  finalBeepFor,
} from '@/styles/sound';
import type {
  CanvasView,
  DuelCanvasView,
  SoloCanvasView,
} from '@/types/canvas';
import type { DuelActor, DuelResult } from '@/types/duel';
import type { SoloEndReason } from '@/types/game';
import type {
  ClockCue,
  HeardSecond,
  ScheduledCue,
  SoundCue,
} from '@/types/sound';

// The round's opening second stays silent
const OPENING_SECONDS = ROUND_MS / 1000;

export const LATE_CUE_DELAY_MS = 300;

// Wait for the reveal or whistle they follow
const LATE_CUES: ReadonlySet<SoundCue> = new Set([
  'turnToYou',
  'resultWin',
  'resultDraw',
  'resultLoss',
  'perfectClear',
  'runOver',
]);

const DUEL_RESULT_CUES: Record<DuelResult['outcome'], SoundCue> = {
  win: 'resultWin',
  forfeit_win: 'resultWin',
  draw: 'resultDraw',
  loss: 'resultLoss',
};

// A quit was the player's choice: no sting
const SOLO_END_CUES: Record<SoloEndReason, SoundCue | null> = {
  perfect_clear: 'perfectClear',
  lives_out: 'runOver',
  quit: null,
};

function isMatchSwitch(prev: CanvasView, next: CanvasView): boolean {
  return (
    prev.match !== null &&
    next.match !== null &&
    prev.match.id !== next.match.id
  );
}

// Players arriving with the match, or several
// at once, are a resume snapshot
function revealCue(prev: CanvasView, next: CanvasView): SoundCue | null {
  if (prev.match === null) return null;
  if (next.found.length !== prev.found.length + 1) return null;
  const known = new Set(prev.found.map((player) => player.id));
  const fresh = next.found.find((player) => !known.has(player.id));
  if (!fresh) return null;
  return fresh.foundBy === 'opponent' ? 'theirReveal' : 'correctNew';
}

function sharedCues(prev: CanvasView, next: CanvasView): SoundCue[] {
  const cues: SoundCue[] = [];
  const reveal = revealCue(prev, next);
  if (reveal) cues.push(reveal);
  if (next.shakeKey > prev.shakeKey) cues.push('notInXi');
  if (next.pulse && next.pulse.key !== prev.pulse?.key) {
    cues.push('alreadyNamed');
  }
  if (next.lifeLostKey > prev.lifeLostKey) cues.push('lifeLost');
  return cues;
}

function duelCues(prev: DuelCanvasView, next: DuelCanvasView): SoundCue[] {
  const cues: SoundCue[] = [];
  if (prev.opponent && next.opponent) {
    if (next.opponent.lives < prev.opponent.lives) cues.push('theirLifeLost');
  }
  if (prev.lobby?.step === 'searching' && next.lobby?.step === 'paired') {
    cues.push('opponentFound');
  }
  if (prev.turn === 'opponent' && next.turn === 'you') cues.push('turnToYou');
  if (!prev.end && next.end) {
    cues.push(
      next.endReason === 'connectionLost'
        ? 'resultLoss'
        : DUEL_RESULT_CUES[next.end.outcome],
    );
  }
  return cues;
}

function soloCues(prev: SoloCanvasView, next: SoloCanvasView): SoundCue[] {
  if (prev.end?.status === 'ready' || next.end?.status !== 'ready') return [];
  const cue = SOLO_END_CUES[next.end.summary.endReason];
  return cue ? [cue] : [];
}

// Reacts to state the server already sent
export function soundCuesFor(prev: CanvasView, next: CanvasView): SoundCue[] {
  if (isMatchSwitch(prev, next)) return [];
  if (prev.mode === 'solo' && next.mode === 'solo') {
    return [...sharedCues(prev, next), ...soloCues(prev, next)];
  }
  if (prev.mode === 'duel' && next.mode === 'duel') {
    return [...sharedCues(prev, next), ...duelCues(prev, next)];
  }
  return [];
}

export function isLateCue(cue: SoundCue): boolean {
  return LATE_CUES.has(cue);
}

// The 11th name and its sting arrive apart
export function scheduleCues(
  cues: SoundCue[],
  msSinceEventCue = Infinity,
): ScheduledCue[] {
  const hasEventCue = cues.some((cue) => !isLateCue(cue));
  const lateDelay = hasEventCue
    ? LATE_CUE_DELAY_MS
    : Math.max(LATE_CUE_DELAY_MS - msSinceEventCue, 0);
  return cues.map((cue) => ({
    cue,
    delayMs: isLateCue(cue) ? lateDelay : 0,
  }));
}

// A new round, or mid-round on mount: listen only
export function heardClockCue(
  last: HeardSecond | null,
  now: HeardSecond,
  owner: DuelActor,
): ClockCue | null {
  if (!last || last.startedAt !== now.startedAt) return null;
  if (last.endsAt !== now.endsAt || last.seconds === now.seconds) return null;
  return clockCueFor(now.seconds, owner);
}

// 0 stays silent: the server's event whistles
export function clockCueFor(
  seconds: number,
  owner: DuelActor,
): ClockCue | null {
  if (!Number.isInteger(seconds)) return null;
  if (seconds < 1 || seconds >= OPENING_SECONDS) return null;
  if (owner === 'opponent') {
    return { cue: SOUND_CUES.tick, gainScale: OPPONENT_TICK_GAIN };
  }
  if (seconds > FINAL_BEEP_FROM) return { cue: SOUND_CUES.tick };
  const beep = finalBeepFor(seconds);
  return beep ? { cue: beep } : null;
}
