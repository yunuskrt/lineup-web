import type { AppConfig } from '@/types/config';
import type { User } from '@/types/user';

// Presentation only: the server enforces every gate
export type ProAccess = 'pending' | 'open' | 'locked';

export const PRO_PATH = '/pro';

// With the split off, nothing may say Pro
export function showsPro(config: AppConfig | null): boolean {
  return config?.proEnabled === true;
}

// No session yet: the guest it gets starts Free
export function proAccess(
  config: AppConfig | null,
  user: User | null,
): ProAccess {
  if (!config) return 'pending';
  if (!config.proEnabled) return 'open';
  return user?.tier === 'pro' ? 'open' : 'locked';
}
