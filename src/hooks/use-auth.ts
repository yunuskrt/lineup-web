import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { unwrap } from '@/lib/api/unwrap';
import { signUpTarget } from '@/lib/auth';
import { HISTORY_QUERY_KEY, PROFILE_QUERY_KEY } from '@/lib/query-keys';
import type { Session, SignInRequest, SignUpRequest } from '@/types/auth';

export const SESSION_QUERY_KEY = ['session'] as const;

// Mutations write the session, so rarely stale
const SESSION_STALE_TIME_MS = 5 * 60_000;

function currentSession(queryClient: QueryClient): Session | null {
  return queryClient.getQueryData<Session | null>(SESSION_QUERY_KEY) ?? null;
}

function useSessionWriter() {
  const queryClient = useQueryClient();
  return (session: Session | null) =>
    queryClient.setQueryData(SESSION_QUERY_KEY, session);
}

const sessionQuery = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: async () => unwrap(await getApiClient().auth.getSession()),
  staleTime: SESSION_STALE_TIME_MS,
});

export function useSession() {
  return useQuery(sessionQuery);
}

export function useSignIn() {
  const writeSession = useSessionWriter();
  return useMutation({
    mutationFn: async (request: SignInRequest) =>
      unwrap(await getApiClient().auth.signIn(request)),
    onSuccess: writeSession,
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();
  const writeSession = useSessionWriter();
  return useMutation({
    mutationFn: async (request: SignUpRequest) => {
      const { auth } = getApiClient();
      const target = signUpTarget(currentSession(queryClient));
      const result =
        target === 'upgradeGuest'
          ? await auth.upgradeGuest(request)
          : await auth.signUp(request);
      return unwrap(result);
    },
    onSuccess: writeSession,
  });
}

export function useContinueAsGuest() {
  const writeSession = useSessionWriter();
  return useMutation({
    mutationFn: async () => unwrap(await getApiClient().auth.continueAsGuest()),
    onSuccess: writeSession,
  });
}

// A signed-out player starts as a guest, no wall
export function useEnsureSession() {
  const queryClient = useQueryClient();
  const writeSession = useSessionWriter();
  return useMutation({
    mutationFn: async () => {
      const session = await queryClient.query(sessionQuery);
      if (session) return session;
      return unwrap(await getApiClient().auth.continueAsGuest());
    },
    onSuccess: writeSession,
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const writeSession = useSessionWriter();
  return useMutation({
    mutationFn: async () => unwrap(await getApiClient().auth.signOut()),
    onSuccess: () => {
      writeSession(null);
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.removeQueries({ queryKey: HISTORY_QUERY_KEY });
    },
  });
}
