import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '@/lib/api/client';
import { createHttpApiClient } from '@/lib/api/http/api-client';
import type { ApiResult } from '@/types/api';

const BASE_URL = 'http://localhost:8080';

const NOT_FOUND = {
  success: false,
  error: { code: 'not_found', message: 'Not found.', retryAfterMs: null },
};

const SIGN_IN = { email: 'a@b.co', password: 'correct-horse' };
const SIGN_UP = { ...SIGN_IN, handle: 'yunus' };
const FILTERS = {
  competitionIds: ['ucl'],
  clubIds: [],
  era: { from: 2004, to: 2010 },
};

type Row = {
  name: string;
  call: (client: ApiClient) => Promise<ApiResult<unknown>>;
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
};

const ROWS: Row[] = [
  {
    name: 'auth.getSession',
    call: (c) => c.auth.getSession(),
    method: 'GET',
    path: '/auth/session',
  },
  {
    name: 'auth.signIn',
    call: (c) => c.auth.signIn(SIGN_IN),
    method: 'POST',
    path: '/auth/sign-in',
    body: SIGN_IN,
  },
  {
    name: 'auth.signUp',
    call: (c) => c.auth.signUp(SIGN_UP),
    method: 'POST',
    path: '/auth/sign-up',
    body: SIGN_UP,
  },
  {
    name: 'auth.continueAsGuest',
    call: (c) => c.auth.continueAsGuest(),
    method: 'POST',
    path: '/auth/guest',
  },
  {
    name: 'auth.upgradeGuest',
    call: (c) => c.auth.upgradeGuest(SIGN_UP),
    method: 'POST',
    path: '/auth/upgrade',
    body: SIGN_UP,
  },
  {
    name: 'auth.signOut',
    call: (c) => c.auth.signOut(),
    method: 'POST',
    path: '/auth/sign-out',
  },
  {
    name: 'catalog.getFilterOptions',
    call: (c) => c.catalog.getFilterOptions(),
    method: 'GET',
    path: '/catalog/filter-options',
  },
  {
    name: 'solo.findMatch',
    call: (c) => c.solo.findMatch(FILTERS),
    method: 'POST',
    path: '/solo/sessions',
    body: FILTERS,
  },
  {
    name: 'solo.chooseSide',
    call: (c) => c.solo.chooseSide('s-1', 'away'),
    method: 'POST',
    path: '/solo/sessions/s-1/side',
    body: { side: 'away' },
  },
  {
    name: 'solo.guess',
    call: (c) => c.solo.guess({ sessionId: 's-1', guess: 'Pirlo' }),
    method: 'POST',
    path: '/solo/sessions/s-1/guesses',
    body: { sessionId: 's-1', guess: 'Pirlo' },
  },
  {
    name: 'solo.syncSession',
    call: (c) => c.solo.syncSession('s-1'),
    method: 'GET',
    path: '/solo/sessions/s-1',
  },
  {
    name: 'solo.quit',
    call: (c) => c.solo.quit('s-1'),
    method: 'POST',
    path: '/solo/sessions/s-1/quit',
  },
  {
    name: 'solo.getSummary',
    call: (c) => c.solo.getSummary('s-1'),
    method: 'GET',
    path: '/solo/sessions/s-1/summary',
  },
  {
    name: 'profile.getProfile',
    call: (c) => c.profile.getProfile(),
    method: 'GET',
    path: '/profile',
  },
  {
    name: 'profile.getHistory',
    call: (c) => c.profile.getHistory({ cursor: null, limit: 20 }),
    method: 'GET',
    path: '/profile/history?limit=20',
  },
];

const fetchMock = vi.fn<typeof fetch>();

function respondWith(body: unknown) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body)));
}

function lastCall(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls.at(-1) ?? [];
  return { url: String(url), init: init ?? {} };
}

describe('createHttpApiClient', () => {
  const client = createHttpApiClient(BASE_URL);

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('covers every REST call in the contract', () => {
    expect(ROWS).toHaveLength(15);
  });

  it.each(ROWS)('$name → $method $path', async (row) => {
    respondWith(NOT_FOUND);
    const result = await row.call(client);

    const { url, init } = lastCall();
    expect(url).toBe(`${BASE_URL}${row.path}`);
    expect(init.method).toBe(row.method);
    expect(init.credentials).toBe('include');
    expect(init.body).toBe(
      row.body === undefined ? undefined : JSON.stringify(row.body),
    );
    expect(result).toEqual(NOT_FOUND);
  });

  it('sends the history cursor when it is set', async () => {
    respondWith(NOT_FOUND);
    await client.profile.getHistory({ cursor: 'h-9', limit: 5 });
    expect(lastCall().url).toBe(
      `${BASE_URL}/profile/history?cursor=h-9&limit=5`,
    );
  });

  it('encodes a session id in the path', async () => {
    respondWith(NOT_FOUND);
    await client.solo.syncSession('a/b?c');
    expect(lastCall().url).toBe(`${BASE_URL}/solo/sessions/a%2Fb%3Fc`);
  });

  it('reads a signed-out session as null', async () => {
    respondWith({ success: true, data: null });
    expect(await client.auth.getSession()).toEqual({
      success: true,
      data: null,
    });
  });

  it('parses a session', async () => {
    const user = { id: 'u-1', handle: 'yunus', isGuest: true, tier: 'free' };
    respondWith({ success: true, data: { user } });
    expect(await client.auth.getSession()).toEqual({
      success: true,
      data: { user },
    });
  });

  it('turns an empty sign-out into a void result', async () => {
    respondWith({ success: true, data: null });
    expect(await client.auth.signOut()).toEqual({
      success: true,
      data: undefined,
    });
  });
});
