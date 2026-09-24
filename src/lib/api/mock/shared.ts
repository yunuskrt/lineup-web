import type { EngineOutcome } from '@/lib/api/mock/engine';
import {
  SEED_AWAY_CLUB,
  SEED_FORMATION,
  SEED_HOME_CLUB,
  SEED_MATCH_IDENTITY,
} from '@/lib/api/mock/data/seed';
import type { ApiError, ApiResult } from '@/types/api';
import type { GuessResult } from '@/types/game';
import type { MaskedMatch, Side } from '@/types/match';

export const ACK: ApiResult<void> = { success: true, data: undefined };

export function ok<T>(data: T): ApiResult<T> {
  return { success: true, data };
}

export function fail<T>(
  code: ApiError['code'],
  message: string,
  retryAfterMs: number | null = null,
): ApiResult<T> {
  return { success: false, error: { code, message, retryAfterMs } };
}

export function maskedMatchFor(side: Side): MaskedMatch {
  return {
    id: SEED_MATCH_IDENTITY.id,
    side,
    team: side === 'home' ? SEED_HOME_CLUB : SEED_AWAY_CLUB,
    formation: SEED_FORMATION,
  };
}

// Only the three outcomes the contract can express — `expired` and
// `ignored` have no GuessResult, so callers must handle them first
export type GuessableOutcome = Extract<
  EngineOutcome,
  { kind: 'correct_new' | 'already_found' | 'not_in_xi' }
>;

export function isGuessable(
  outcome: EngineOutcome,
): outcome is GuessableOutcome {
  return (
    outcome.kind === 'correct_new' ||
    outcome.kind === 'already_found' ||
    outcome.kind === 'not_in_xi'
  );
}

export function toGuessResult(outcome: GuessableOutcome): GuessResult {
  if (outcome.kind === 'correct_new') {
    return { outcome: 'correct_new', player: outcome.player };
  }

  if (outcome.kind === 'already_found') {
    return { outcome: 'already_found', playerId: outcome.playerId };
  }

  return { outcome: 'not_in_xi' };
}
