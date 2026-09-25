import type { CountdownStage } from '@/types/countdown';
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
