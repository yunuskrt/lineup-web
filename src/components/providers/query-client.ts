import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { clearSession } from '@/hooks/use-auth';
import { shouldRetryQuery } from '@/lib/api/retry';
import { isSessionLost } from '@/lib/api/session-loss';

export function createQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    // A 401 anywhere but sign-in signs the player out
    queryCache: new QueryCache({
      onError: (error) => {
        if (isSessionLost(error)) clearSession(queryClient);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _result, mutation) => {
        if (isSessionLost(error, mutation.meta)) clearSession(queryClient);
      },
    }),
    defaultOptions: {
      queries: { retry: shouldRetryQuery },
      // A guess or sign-up is never sent twice
      mutations: { retry: false },
    },
  });
  return queryClient;
}
