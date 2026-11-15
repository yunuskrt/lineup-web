import type { CountdownStage, RingMode } from '@/types/countdown';
import type { DuelActor } from '@/types/duel';
import type { RoundTiming } from '@/types/game';

export const WARNING_SECONDS = 7;
export const CRITICAL_SECONDS = 3;

export function roundDurationMs(round: RoundTiming): number {
  return round.endsAt - round.startedAt;
}

export function remainingMs(round: RoundTiming, now: number): number {
  return Math.min(Math.max(round.endsAt - now, 0), roundDurationMs(round));
}

export function displaySeconds(remaining: number): number {
  return Math.ceil(remaining / 1000);
}

export function sweepFraction(remaining: number, round: RoundTiming): number {
  const duration = roundDurationMs(round);
  if (duration <= 0) return 0;
  return Math.min(Math.max(remaining / duration, 0), 1);
}

export function countdownStage(seconds: number): CountdownStage {
  if (seconds <= CRITICAL_SECONDS) return 'critical';
  if (seconds <= WARNING_SECONDS) return 'warning';
  return 'calm';
}

// The open ring's share of a full circle
export const ARC_SPAN = 0.75;

// Linear: time left maps straight onto the arc's length
export function arcDashArray(fraction: number): string {
  return `${Math.min(Math.max(fraction, 0), 1) * ARC_SPAN} 1`;
}

// Urgency belongs to your own clock, never the opponent's
export function ringStage(
  mode: RingMode,
  owner: DuelActor,
  seconds: number,
): CountdownStage {
  if (mode === 'waiting' || owner === 'opponent') return 'calm';
  return countdownStage(seconds);
}
