import type { DuelClient } from '@/lib/api/duel-client';
import type { ApiError, ApiResult } from '@/types/api';

export const DUEL_UNAVAILABLE_ERROR: ApiError = {
  code: 'server_error',
  message: "Live duels aren't connected yet.",
  retryAfterMs: null,
};

async function refuse(): Promise<ApiResult<void>> {
  return { success: false, error: DUEL_UNAVAILABLE_ERROR };
}

// Stands in for the socket client until W30
export function createUnavailableDuelClient(): DuelClient {
  return {
    connect: refuse,
    disconnect: () => {},
    enterQueue: refuse,
    leaveQueue: refuse,
    submitFilters: refuse,
    guess: refuse,
    forfeit: refuse,
    on: () => () => {},
  };
}
