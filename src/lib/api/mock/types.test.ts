import { describe, expect, it } from 'vitest';
import { SEED_SQUAD } from '@/lib/api/mock/data/seed';
import { mockSquadSchema } from '@/lib/api/mock/types';

// Guards fixture quality — W07 replaces the seed with real lineups
describe('mockSquadSchema', () => {
  it('accepts the seed squad', () => {
    expect(mockSquadSchema.safeParse(SEED_SQUAD).success).toBe(true);
  });

  it('rejects a squad that is not exactly eleven', () => {
    expect(mockSquadSchema.safeParse(SEED_SQUAD.slice(0, 10)).success).toBe(
      false,
    );

    const twelve = [...SEED_SQUAD, { ...SEED_SQUAD[0], playerId: 'pl-12' }];
    expect(mockSquadSchema.safeParse(twelve).success).toBe(false);
  });

  it('rejects two players sharing a formation slot', () => {
    const clashing = SEED_SQUAD.map((entry, index) =>
      index === 1 ? { ...entry, slot: SEED_SQUAD[0].slot } : entry,
    );

    expect(mockSquadSchema.safeParse(clashing).success).toBe(false);
  });

  it('rejects a player with no aliases', () => {
    const aliasless = SEED_SQUAD.map((entry, index) =>
      index === 0 ? { ...entry, aliases: [] } : entry,
    );

    expect(mockSquadSchema.safeParse(aliasless).success).toBe(false);
  });
});
