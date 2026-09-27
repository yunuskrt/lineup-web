import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { unwrap } from '@/lib/api/unwrap';
import { signUpTarget } from '@/lib/auth';
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

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => unwrap(await getApiClient().auth.getSession()),
    staleTime: SESSION_STALE_TIME_MS,
  });
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

export function useSignOut() {
  const writeSession = useSessionWriter();
  return useMutation({
    mutationFn: async () => unwrap(await getApiClient().auth.signOut()),
    onSuccess: () => writeSession(null),
  });
}
