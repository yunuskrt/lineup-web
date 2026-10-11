import { describe, expect, it, vi } from 'vitest';
import {
  createUnavailableDuelClient,
  DUEL_UNAVAILABLE_ERROR,
} from '@/lib/api/http/duel-client';

const REFUSED = { success: false, error: DUEL_UNAVAILABLE_ERROR };

describe('createUnavailableDuelClient', () => {
  const client = createUnavailableDuelClient();

  it('refuses every command', async () => {
    const filters = {
      competitionIds: [],
      clubIds: [],
      era: { from: 2000, to: 2025 },
    };

    expect(await client.connect()).toEqual(REFUSED);
    expect(await client.enterQueue()).toEqual(REFUSED);
    expect(await client.leaveQueue()).toEqual(REFUSED);
    expect(await client.submitFilters(filters)).toEqual(REFUSED);
    expect(await client.guess({ sessionId: 'd-1', guess: 'Pirlo' })).toEqual(
      REFUSED,
    );
    expect(await client.forfeit()).toEqual(REFUSED);
  });

  it('never fires an event, and unsubscribes cleanly', () => {
    const handler = vi.fn();
    const unsubscribe = client.on('roundStarted', handler);

    expect(() => unsubscribe()).not.toThrow();
    expect(() => client.disconnect()).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });
});
