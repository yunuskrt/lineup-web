import { describe, expect, it } from 'vitest';
import { createMockApiClient } from '@/lib/api/mock/api-client';
import { FIXTURES, squadFor } from '@/lib/api/mock/data/fixtures';
import { PLAYERS } from '@/lib/api/mock/data/players';
import {
  directoryKeyFor,
  PLAYER_DIRECTORY,
} from '@/lib/api/mock/directory';
import { playerDirectorySchema } from '@/lib/api/schemas/catalog';

describe('mock player directory', () => {
  const keys = PLAYER_DIRECTORY.players.map((player) => player.key);

  it('lists every fixture player and passes the schema', () => {
    expect(PLAYER_DIRECTORY.players).toHaveLength(PLAYERS.length);
    expect(playerDirectorySchema.safeParse(PLAYER_DIRECTORY).success).toBe(
      true,
    );
  });

  it('gives each player a unique key that is not its id', () => {
    expect(new Set(keys).size).toBe(keys.length);
    const ids = new Set(PLAYERS.map((player) => player.id));
    expect(keys.some((key) => ids.has(key))).toBe(false);
  });

  it('is sorted by key, as the backend sorts it', () => {
    expect(keys).toEqual([...keys].sort());
  });

  // Ids sort by squad; the keys must not
  it('keeps a squad from sitting together in key order', () => {
    const squad = squadFor(FIXTURES[0], 'home');
    const positions = squad
      .map((entry) => keys.indexOf(directoryKeyFor(entry.playerId)))
      .sort((a, b) => a - b);
    const span = positions[positions.length - 1] - positions[0];
    expect(span).toBeGreaterThan(squad.length * 3);
  });

  it("carries each player's aliases as terms, and its photo", () => {
    for (const player of PLAYERS) {
      const entry = PLAYER_DIRECTORY.players.find(
        (item) => item.key === directoryKeyFor(player.id),
      );
      expect(entry?.terms).toEqual([...new Set(player.aliases)].sort());
      expect(entry?.imageUrl).toBe(player.imageUrl);
    }
  });

  it('is served to a session, and refused without one', async () => {
    const api = createMockApiClient();
    const refused = await api.catalog.getPlayerDirectory();
    expect(refused.success).toBe(false);

    await api.auth.continueAsGuest();
    const served = await api.catalog.getPlayerDirectory();
    expect(served).toEqual({ success: true, data: PLAYER_DIRECTORY });
  });

  it('marks a revealed player with its directory key', async () => {
    const api = createMockApiClient({ random: () => 0 });
    await api.auth.continueAsGuest();
    const offer = await api.solo.findMatch({
      competitionIds: [],
      clubIds: [],
      era: { from: 2000, to: 2025 },
    });
    if (!offer.success) throw new Error('No offer');
    await api.solo.chooseSide(offer.data.sessionId, 'home');
    const step = await api.solo.guess({
      sessionId: offer.data.sessionId,
      guess: 'Moss',
    });
    if (!step.success || step.data.result.outcome !== 'correct_new') {
      throw new Error('Expected a correct guess');
    }

    const { player } = step.data.result;
    expect(keys).toContain(player.directoryKey);
    expect(player.directoryKey).toBe(directoryKeyFor(player.id));
  });
});
