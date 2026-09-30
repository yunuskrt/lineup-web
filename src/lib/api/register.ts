import { setApiClient } from '@/lib/api/client';
import { API_MODE } from '@/lib/api/config';
import { setDuelClient } from '@/lib/api/duel-client';
import { createMockApiClient } from '@/lib/api/mock/api-client';
import { createMockDuelClient } from '@/lib/api/mock/duel-client';
import { createStore } from '@/lib/api/mock/store';

let isRegistered = false;

export function registerApiClient(): void {
  if (isRegistered) return;

  if (API_MODE === 'real') {
    throw new Error(
      'NEXT_PUBLIC_API_MODE=real, but the real API client arrives in W27.',
    );
  }

  // One store, so a finished duel reaches the profile
  const store = createStore();
  setApiClient(createMockApiClient({ store }));
  setDuelClient(createMockDuelClient({ store }));
  isRegistered = true;
}
