import { z } from 'zod';
import type { Tier } from '@/types/user';

export type ApiMode = 'mock' | 'real';

// Names a mode, never a secret: safe to ship
export const API_MODE: ApiMode =
  process.env.NEXT_PUBLIC_API_MODE === 'real' ? 'real' : 'mock';

// Mock only: the real backend decides the tier
export const MOCK_TIER: Tier =
  process.env.NEXT_PUBLIC_MOCK_TIER === 'pro' ? 'pro' : 'free';

// Mock only: mirrors the backend's PRO_ENABLED
export const MOCK_PRO_ENABLED =
  process.env.NEXT_PUBLIC_MOCK_PRO_ENABLED !== 'false';

const API_URL_VAR = 'NEXT_PUBLIC_API_URL';

// Zod runs this even after the URL check fails
function isOrigin(value: string): boolean {
  return URL.canParse(value) && new URL(value).origin === value;
}

const apiUrlSchema = z
  .url({ protocol: /^https?$/, error: 'must be an http(s) URL' })
  .refine(isOrigin, {
    error: 'must be an origin, with no path or trailing slash',
  });

// Throws, so a bad value stops the app at startup
export function resolveApiUrl(
  raw: string | undefined,
  isProduction: boolean,
): string {
  if (!raw) {
    throw new Error(`${API_URL_VAR} is missing. Set it in .env.local.`);
  }

  const parsed = apiUrlSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`${API_URL_VAR} ${parsed.error.issues[0].message}.`);
  }

  if (isProduction && !isSecure(new URL(raw))) {
    throw new Error(`${API_URL_VAR} must use https in production.`);
  }

  return parsed.data;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

// `next build` is always production; allow a local backend
function isSecure(url: URL): boolean {
  return url.protocol === 'https:' || LOOPBACK_HOSTS.has(url.hostname);
}

export function apiUrl(): string {
  // Direct reads, so Next inlines both values
  return resolveApiUrl(
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NODE_ENV === 'production',
  );
}
