import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSession,
  ensureSession,
  failureOf,
  SESSION_QUERY_KEY,
} from '@/hooks/use-auth';
import { getApiClient, setApiClient, type ApiClient } from '@/lib/api/client';
import { ApiRequestError } from '@/lib/api/unwrap';
import { HISTORY_QUERY_KEY, PROFILE_QUERY_KEY } from '@/lib/query-keys';
import type { Session } from '@/types/auth';

function sessionOf(id: string, isGuest: boolean): Session {
  return {
    user: { id, handle: id, isGuest, emailVerified: false, tier: 'free' },
  };
}

const ACCOUNT = sessionOf('user-1', false);
const GUEST = sessionOf('guest-1', true);

describe('ensureSession', () => {
  let original: ApiClient;
  let queryClient: QueryClient;
  let serverSession: Session | null;
  const getSession = vi.fn(async () => ({
    success: true as const,
    data: serverSession,
  }));
  const continueAsGuest = vi.fn(async () => ({
    success: true as const,
    data: GUEST,
  }));

  beforeEach(() => {
    original = getApiClient();
    setApiClient({
      ...original,
      auth: { ...original.auth, getSession, continueAsGuest },
    });
    queryClient = new QueryClient();
  });

  afterEach(() => {
    setApiClient(original);
    getSession.mockClear();
    continueAsGuest.mockClear();
  });

  it('asks the server even when a session is cached', async () => {
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
    serverSession = ACCOUNT;

    expect(await ensureSession(queryClient)).toEqual(ACCOUNT);
    expect(getSession).toHaveBeenCalledOnce();
  });

  it('returns the server session without creating a guest', async () => {
    queryClient.setQueryData(SESSION_QUERY_KEY, GUEST);
    serverSession = ACCOUNT;

    expect(await ensureSession(queryClient)).toEqual(ACCOUNT);
    expect(continueAsGuest).not.toHaveBeenCalled();
  });

  it('creates a guest only when the server has no session', async () => {
    queryClient.setQueryData(SESSION_QUERY_KEY, ACCOUNT);
    serverSession = null;

    expect(await ensureSession(queryClient)).toEqual(GUEST);
    expect(continueAsGuest).toHaveBeenCalledOnce();
  });
});

describe('clearSession', () => {
  it('signs out and drops the user numbers', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(SESSION_QUERY_KEY, ACCOUNT);
    queryClient.setQueryData([...PROFILE_QUERY_KEY, 'user-1'], { any: 1 });
    queryClient.setQueryData([...HISTORY_QUERY_KEY, 'user-1'], { any: 1 });

    clearSession(queryClient);

    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
    expect(
      queryClient.getQueryData([...PROFILE_QUERY_KEY, 'user-1']),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData([...HISTORY_QUERY_KEY, 'user-1']),
    ).toBeUndefined();
  });
});

describe('failureOf', () => {
  const unauthorized = new ApiRequestError({
    code: 'unauthorized',
    message: 'Sign in or continue as a guest first.',
    retryAfterMs: null,
  });

  it('signs out on a 401 and returns its error', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(SESSION_QUERY_KEY, ACCOUNT);

    expect(failureOf(queryClient, unauthorized)).toBe(unauthorized.error);
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });

  it('keeps the session for any other failure', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(SESSION_QUERY_KEY, ACCOUNT);
    const network = new ApiRequestError({
      code: 'network',
      message: 'Offline.',
      retryAfterMs: null,
    });

    expect(failureOf(queryClient, network).code).toBe('network');
    expect(failureOf(queryClient, new Error('boom')).code).toBe('server_error');
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBe(ACCOUNT);
  });
});
