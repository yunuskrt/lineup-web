import { API_MODE, apiUrl, MOCK_PRO_ENABLED } from '@/lib/api/config';
import { appConfigSchema } from '@/lib/api/schemas/config';
import { apiResultSchema } from '@/lib/api/schemas/result';

// The backend's own max-age on GET /config
export const CONFIG_REVALIDATE_SECONDS = 300;

// Off only when the server says so; unknown is not off
export function isSwitchOffIn(body: unknown): boolean {
  const parsed = apiResultSchema(appConfigSchema).safeParse(body);
  return parsed.success && parsed.data.success && !parsed.data.data.proEnabled;
}

// Server only: a failed fetch is never a 404
export async function isProSwitchOff(): Promise<boolean> {
  if (API_MODE === 'mock') return !MOCK_PRO_ENABLED;
  try {
    const response = await fetch(`${apiUrl()}/config`, {
      next: { revalidate: CONFIG_REVALIDATE_SECONDS },
    });
    return isSwitchOffIn(await response.json());
  } catch {
    return false;
  }
}
