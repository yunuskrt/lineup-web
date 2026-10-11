import { MutationObserver, type QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '@/components/providers/query-client';
import { SESSION_QUERY_KEY } from '@/hooks/use-auth';
import { ApiRequestError } from '@/lib/api/unwrap';
import { PROFILE_QUERY_KEY } from '@/lib/query-keys';
import type { ApiErrorCode } from '@/types/api';
import type { Session } from '@/types/auth';
import type { MutationMeta } from '@/types/query';

const GUEST: Session = {
  user: {
    id: 'guest-1',
    handle: 'guest-1abc2def',
    isGuest: true,
    emailVerified: false,
    tier: 'free',
  },
};

function failure(code: ApiErrorCode): ApiRequestError {
  return new ApiRequestError({ code, message: 'x', retryAfterMs: null });
}

async function runMutation(
  queryClient: QueryClient,
  code: ApiErrorCode,
  meta?: MutationMeta,
) {
  const mutationFn = vi.fn(async () => {
    throw failure(code);
  });
  const observer = new MutationObserver(queryClient, { mutationFn, meta });
  await observer.mutate().catch(() => {});
  return mutationFn;
}

describe('createQueryClient', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    queryClient.setQueryData(SESSION_QUERY_KEY, GUEST);
    queryClient.setQueryData([...PROFILE_QUERY_KEY, 'guest-1'], { any: 1 });
  });

  it('signs out when a query gets unauthorized, without retrying', async () => {
    const queryFn = vi.fn(async () => {
      throw failure('unauthorized');
    });
    await queryClient
      .query({ queryKey: ['history', 'guest-1'], queryFn })
      .catch(() => {});

    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
    expect(
      queryClient.getQueryData([...PROFILE_QUERY_KEY, 'guest-1']),
    ).toBeUndefined();
  });

  it('keeps the session when a query fails another way', async () => {
    const queryFn = vi.fn(async () => {
      throw failure('not_found');
    });
    await queryClient.query({ queryKey: ['catalog'], queryFn }).catch(() => {});

    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(GUEST);
  });

  it('keeps a guest who gets a wrong password at sign-in', async () => {
    await runMutation(queryClient, 'unauthorized', { isCredentialCheck: true });
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(GUEST);
  });

  it('signs out when any other mutation gets unauthorized', async () => {
    await runMutation(queryClient, 'unauthorized');
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });

  it('sends a failed mutation once, never again', async () => {
    const mutationFn = await runMutation(queryClient, 'network');
    expect(mutationFn).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(GUEST);
  });
});
