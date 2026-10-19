import { z } from 'zod';
import type { DuelEvent, DuelEventMap } from '@/lib/api/duel-client';
import { BAD_RESPONSE_ERROR, NETWORK_ERROR } from '@/lib/api/http/transport';
import {
  coinFlipResultSchema,
  connectionStateSchema,
  duelFoundPlayerSchema,
  duelLifeLostSchema,
  duelResultSchema,
  duelSessionSchema,
  filterSubmissionSchema,
  pairedStateSchema,
  queueStateSchema,
  queueTimeoutSchema,
} from '@/lib/api/schemas/duel';
import { guessResultSchema } from '@/lib/api/schemas/game';
import { apiErrorSchema, apiResultSchema } from '@/lib/api/schemas/result';
import type { ApiError, ApiErrorCode, ApiResult } from '@/types/api';

// Events carry plain payloads, not envelopes
const DUEL_EVENT_SCHEMAS: {
  [E in DuelEvent]: z.ZodType<DuelEventMap[E]>;
} = {
  queued: queueStateSchema,
  queueTimedOut: queueTimeoutSchema,
  paired: pairedStateSchema,
  filtersUpdated: filterSubmissionSchema,
  coinFlip: coinFlipResultSchema,
  matchReady: duelSessionSchema,
  roundStarted: duelSessionSchema,
  guessResolved: guessResultSchema,
  playerRevealed: duelFoundPlayerSchema,
  lifeLost: duelLifeLostSchema,
  turnChanged: duelSessionSchema,
  opponentConnection: connectionStateSchema,
  finished: duelResultSchema,
  disconnected: connectionStateSchema,
  error: apiErrorSchema,
};

export const DUEL_EVENTS = Object.keys(DUEL_EVENT_SCHEMAS) as DuelEvent[];

export type ParsedEvent<E extends DuelEvent> =
  | { success: true; payload: DuelEventMap[E] }
  | { success: false; paths: string[] };

export function parseEvent<E extends DuelEvent>(
  event: E,
  payload: unknown,
): ParsedEvent<E> {
  const parsed = DUEL_EVENT_SCHEMAS[event].safeParse(payload);
  if (parsed.success) return { success: true, payload: parsed.data };
  return {
    success: false,
    paths: parsed.error.issues.map((issue) => issue.path.join('.')),
  };
}

const refusalSchema = z.object({
  success: z.literal(false),
  error: apiErrorSchema,
});

function dataOf(err: unknown): unknown {
  if (typeof err !== 'object' || err === null || !('data' in err)) {
    return undefined;
  }
  return err.data;
}

// A refusal carries the envelope in `data`
export function refusalOf(err: unknown): ApiError {
  const data = dataOf(err);
  // No data: the transport failed, not the server
  if (data === undefined) return NETWORK_ERROR;
  const parsed = refusalSchema.safeParse(data);
  return parsed.success ? parsed.data.error : BAD_RESPONSE_ERROR;
}

const ackSchema = apiResultSchema(z.null());

export function ackResultOf(response: unknown): ApiResult<void> {
  const parsed = ackSchema.safeParse(response);
  if (!parsed.success) return { success: false, error: BAD_RESPONSE_ERROR };
  if (!parsed.data.success) return parsed.data;
  return { success: true, data: undefined };
}

const UNAUTHORIZED_RETRIES = 1;
const SERVER_ERROR_DELAYS_MS = [1_000, 2_000];

// Wait before retrying a refusal, or null
export function handshakeRetryDelay(
  code: ApiErrorCode,
  retriesSoFar: number,
): number | null {
  if (code === 'unauthorized') {
    return retriesSoFar < UNAUTHORIZED_RETRIES ? 0 : null;
  }
  if (code === 'server_error') {
    return SERVER_ERROR_DELAYS_MS[retriesSoFar] ?? null;
  }
  return null;
}
