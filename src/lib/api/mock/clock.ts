import type { RoundTiming } from '@/types/game';

export const ROUND_DURATION_MS = 15_000;
export const GRACE_WINDOW_MS = 400;

export function startRound(now: number): RoundTiming {
  return { startedAt: now, endsAt: now + ROUND_DURATION_MS };
}

export function hasExpired(round: RoundTiming, now: number): boolean {
  return now > round.endsAt + GRACE_WINDOW_MS;
}
