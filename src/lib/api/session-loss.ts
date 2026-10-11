import { ApiRequestError } from '@/lib/api/unwrap';
import type { MutationMeta } from '@/types/query';

// A 401 means the server no longer knows this session
export function isSessionLost(error: unknown, meta?: MutationMeta): boolean {
  if (meta?.isCredentialCheck) return false;
  return (
    error instanceof ApiRequestError && error.error.code === 'unauthorized'
  );
}
