import { queryOptions, useQuery } from '@tanstack/react-query';
import { useSession } from '@/hooks/use-auth';
import { getApiClient } from '@/lib/api';
import { CONFIG_MAX_AGE_SECONDS } from '@/lib/api/config';
import { unwrap } from '@/lib/api/unwrap';
import { proAccess } from '@/lib/pro';
import type { ProAccess } from '@/types/pro';

export const APP_CONFIG_QUERY_KEY = ['app-config'] as const;

const appConfigQuery = queryOptions({
  queryKey: APP_CONFIG_QUERY_KEY,
  queryFn: async () => unwrap(await getApiClient().config.getConfig()),
  staleTime: CONFIG_MAX_AGE_SECONDS * 1000,
});

export function useAppConfig() {
  return useQuery(appConfigQuery);
}

export function useProAccess(): ProAccess {
  const config = useAppConfig();
  const session = useSession();
  // A session still loading must not flash a lock
  if (session.isPending) return 'pending';
  return proAccess(config.data ?? null, session.data?.user ?? null);
}
