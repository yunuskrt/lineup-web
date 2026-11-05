import { describe, expect, it } from 'vitest';
import { COMPETITION_KIND_PATH } from '@/components/game/competition-kind';
import { competitionKindSchema } from '@/lib/api/schemas/common';
import { competitionGroups } from '@/lib/filters';

describe('competition kind icons', () => {
  const groups = competitionGroups(
    competitionKindSchema.options.map((kind) => ({ kind })),
  );

  it('gives every kind in a group the same icon', () => {
    for (const group of groups) {
      const paths = group.competitions.map(
        ({ kind }) => COMPETITION_KIND_PATH[kind],
      );
      expect(new Set(paths).size, group.label).toBe(1);
    }
  });

  it('gives each group its own icon', () => {
    const paths = groups.map(
      (group) => COMPETITION_KIND_PATH[group.competitions[0].kind],
    );
    expect(groups).toHaveLength(3);
    expect(new Set(paths).size).toBe(groups.length);
  });
});
