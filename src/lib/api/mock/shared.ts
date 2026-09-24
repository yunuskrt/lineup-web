import type { EngineOutcome } from '@/lib/api/mock/engine';
import type { EmptyPoolReason } from '@/lib/api/mock/pool';
import type { MockFixture } from '@/lib/api/mock/types';
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

export function maskedMatchFor(fixture: MockFixture, side: Side): MaskedMatch {
  return {
    id: fixture.identity.id,
    side,
    team: fixture.identity[side],
    formation: fixture[side].formation,
  };
}

// Names the filter to widen — never a bare "no results"
export const EMPTY_POOL_MESSAGES: Record<EmptyPoolReason, string> = {
  competition: 'No match fits that competition. Try adding another one.',
  club: 'No match fits the clubs you picked. Try adding another.',
  era: 'No match fits those years. Try widening the era.',
  combination:
    'No match fits these filters together. Try widening any one of them.',
};

export function emptyPool<T>(reason: EmptyPoolReason): ApiResult<T> {
  return fail('empty_pool', EMPTY_POOL_MESSAGES[reason]);
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
