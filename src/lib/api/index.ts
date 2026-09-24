import { registerApiClient } from '@/lib/api/register';

// Importing this module is what selects the adapter
registerApiClient();

export { getApiClient } from '@/lib/api/client';
export type { ApiClient } from '@/lib/api/client';
export { getDuelClient } from '@/lib/api/duel-client';
export type { DuelClient } from '@/lib/api/duel-client';
