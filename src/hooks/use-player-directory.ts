import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { useSession } from '@/hooks/use-auth';
import { getApiClient } from '@/lib/api';
import { unwrap } from '@/lib/api/unwrap';
import { buildSuggestionIndex, type SuggestionIndex } from '@/lib/suggestions';

export const PLAYER_DIRECTORY_QUERY_KEY = ['player-directory'] as const;

// The mount's fetch already covers the first match
export function needsDirectoryRecheck(
  seenMatchKey: string | null,
  matchKey: string | null,
): boolean {
  return seenMatchKey !== null && matchKey !== null && matchKey !== seenMatchKey;
}

// One check on mount, then one per new match
export function usePlayerDirectory(
  matchKey: string | null,
): SuggestionIndex | null {
  const queryClient = useQueryClient();
  // A 401 signs out, so wait for the guest session
  const hasSession = Boolean(useSession().data);
  const seenMatchKey = useRef<string | null>(null);
  const { data } = useQuery({
    queryKey: PLAYER_DIRECTORY_QUERY_KEY,
    queryFn: async () =>
      unwrap(await getApiClient().catalog.getPlayerDirectory()),
    enabled: hasSession,
    staleTime: Infinity,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (matchKey === null) return;
    const isNewMatch = needsDirectoryRecheck(seenMatchKey.current, matchKey);
    seenMatchKey.current = matchKey;
    if (!isNewMatch) return;
    void queryClient.refetchQueries({
      queryKey: PLAYER_DIRECTORY_QUERY_KEY,
      exact: true,
    });
  }, [matchKey, queryClient]);

  return useMemo(
    () => (data ? buildSuggestionIndex(data.players) : null),
    [data],
  );
}
