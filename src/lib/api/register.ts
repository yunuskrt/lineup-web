import { setApiClient } from '@/lib/api/client';
import { API_MODE } from '@/lib/api/config';
import { setDuelClient } from '@/lib/api/duel-client';
import { createMockApiClient } from '@/lib/api/mock/api-client';
import { createMockDuelClient } from '@/lib/api/mock/duel-client';
import { type DuelScenario, isDuelScenario } from '@/lib/api/mock/scenarios';
import { createStore } from '@/lib/api/mock/store';

export const SCENARIO_PARAM = 'scenario';

// Low enough to trip by typing
const SCENARIO_RATE_LIMIT = { max: 2, windowMs: 3_000 };

let isRegistered = false;

// Read once, on a full page load, outside production
export function scenarioFrom(search: string): DuelScenario | undefined {
  if (process.env.NODE_ENV === 'production') return undefined;
  const name = new URLSearchParams(search).get(SCENARIO_PARAM);
  return name !== null && isDuelScenario(name) ? name : undefined;
}

export function registerApiClient(): void {
  if (isRegistered) return;

  if (API_MODE === 'real') {
    throw new Error(
      'NEXT_PUBLIC_API_MODE=real, but the real API client arrives in W27.',
    );
  }

  const scenario =
    typeof window === 'undefined'
      ? undefined
      : scenarioFrom(window.location.search);
  // One store, so a finished duel reaches the profile
  const store = createStore();
  setApiClient(
    createMockApiClient({
      store,
      rateLimit: scenario === 'rateLimited' ? SCENARIO_RATE_LIMIT : undefined,
    }),
  );
  setDuelClient(createMockDuelClient({ store, scenario }));
  isRegistered = true;
}
