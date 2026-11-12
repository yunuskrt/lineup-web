import { z } from 'zod';
import type { ApiClient } from '@/lib/api/client';
import { createTransport } from '@/lib/api/http/transport';
import { gatewayTokenSchema, sessionSchema } from '@/lib/api/schemas/auth';
import {
  catalogOverviewSchema,
  filterOptionsSchema,
  playerDirectorySchema,
} from '@/lib/api/schemas/catalog';
import { appConfigSchema } from '@/lib/api/schemas/config';
import { historyPageSchema, profileSchema } from '@/lib/api/schemas/profile';
import {
  soloAllowanceSchema,
  soloGuessResponseSchema,
  soloMatchOfferSchema,
  soloSessionSchema,
  soloSummarySchema,
} from '@/lib/api/schemas/solo';
import type { ApiResult } from '@/types/api';

function toVoid(result: ApiResult<null>): ApiResult<void> {
  return result.success ? { success: true, data: undefined } : result;
}

function soloPath(sessionId: string, rest = ''): string {
  return `/solo/sessions/${encodeURIComponent(sessionId)}${rest}`;
}

// Paths from context/docs/contract.md §4
export function createHttpApiClient(baseUrl: string): ApiClient {
  const request = createTransport(baseUrl);

  return {
    config: {
      getConfig: () => request('GET', '/config', appConfigSchema),
    },
    auth: {
      getSession: () =>
        request('GET', '/auth/session', sessionSchema.nullable()),
      signIn: (body) =>
        request('POST', '/auth/sign-in', sessionSchema, { body }),
      signUp: (body) =>
        request('POST', '/auth/sign-up', sessionSchema, { body }),
      continueAsGuest: () => request('POST', '/auth/guest', sessionSchema),
      upgradeGuest: (body) =>
        request('POST', '/auth/upgrade', sessionSchema, { body }),
      signOut: async () =>
        toVoid(await request('POST', '/auth/sign-out', z.null())),
      getGatewayToken: () => request('GET', '/auth/token', gatewayTokenSchema),
    },
    catalog: {
      getFilterOptions: () =>
        request('GET', '/catalog/filter-options', filterOptionsSchema),
      // Revalidated by ETag: ~300 bytes when unchanged
      getPlayerDirectory: () =>
        request('GET', '/catalog/players', playerDirectorySchema, {
          cache: 'no-cache',
        }),
      getOverview: () =>
        request('GET', '/catalog/overview', catalogOverviewSchema),
    },
    solo: {
      findMatch: (filters) =>
        request('POST', '/solo/sessions', soloMatchOfferSchema, {
          body: filters,
        }),
      chooseSide: (sessionId, side) =>
        request('POST', soloPath(sessionId, '/side'), soloSessionSchema, {
          body: { side },
        }),
      guess: (body) =>
        request(
          'POST',
          soloPath(body.sessionId, '/guesses'),
          soloGuessResponseSchema,
          { body },
        ),
      syncSession: (sessionId) =>
        request('GET', soloPath(sessionId), soloSessionSchema),
      quit: (sessionId) =>
        request('POST', soloPath(sessionId, '/quit'), soloSummarySchema),
      getSummary: (sessionId) =>
        request('GET', soloPath(sessionId, '/summary'), soloSummarySchema),
      getAllowance: () =>
        request('GET', '/solo/allowance', soloAllowanceSchema),
    },
    profile: {
      getProfile: () => request('GET', '/profile', profileSchema),
      getHistory: ({ cursor, limit }) =>
        request('GET', '/profile/history', historyPageSchema, {
          query: { cursor, limit },
        }),
    },
  };
}
