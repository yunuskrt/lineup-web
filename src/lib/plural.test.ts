import { describe, expect, it } from 'vitest';
import { pluralOf } from '@/lib/plural';

describe('pluralOf', () => {
  it('uses the singular for exactly one', () => {
    expect(pluralOf(1, 'duel', 'duels')).toBe('duel');
  });

  it('uses the plural for zero and for more than one', () => {
    expect(pluralOf(0, 'duel', 'duels')).toBe('duels');
    expect(pluralOf(2, 'life left', 'lives left')).toBe('lives left');
  });
});
