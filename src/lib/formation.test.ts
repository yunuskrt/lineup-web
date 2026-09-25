import { describe, expect, it } from 'vitest';
import { parseFormation, positionForSlot, slotLayout } from '@/lib/formation';
import type { SlotPoint } from '@/types/formation';

const FIXTURE_FORMATIONS = [
  '4-4-2',
  '4-3-3',
  '4-2-3-1',
  '3-5-2',
  '3-4-3',
  '4-1-4-1',
  '4-1-2-1-2',
];

function layoutOf(formation: string): SlotPoint[] {
  const points = slotLayout(formation);
  if (!points) throw new Error(`No layout for ${formation}`);
  return points;
}

function linesOf(formation: string): SlotPoint[][] {
  const points = layoutOf(formation);
  const rows = new Map<number, SlotPoint[]>();
  for (const point of points.slice(1)) {
    rows.set(point.y, [...(rows.get(point.y) ?? []), point]);
  }
  return [...rows.values()];
}

describe('parseFormation', () => {
  it('returns the outfield line sizes', () => {
    expect(parseFormation('4-2-3-1')).toEqual([4, 2, 3, 1]);
  });

  it.each(['4-4-3', '3-3-3', '4-6-0', '4-x-2'])('rejects %s', (formation) => {
    expect(parseFormation(formation)).toBeNull();
  });
});

describe('positionForSlot', () => {
  it('puts the goalkeeper in slot 0', () => {
    expect(positionForSlot('4-4-2', 0)).toBe('GK');
  });

  it('maps 4-2-3-1 as DF×4, MF×5, FW×1', () => {
    const positions = Array.from({ length: 11 }, (_, slot) =>
      positionForSlot('4-2-3-1', slot),
    );
    expect(positions).toEqual([
      'GK',
      ...Array(4).fill('DF'),
      ...Array(5).fill('MF'),
      'FW',
    ]);
  });

  it('treats every middle line of a five-line formation as MF', () => {
    const positions = Array.from({ length: 11 }, (_, slot) =>
      positionForSlot('4-1-2-1-2', slot),
    );
    expect(positions).toEqual([
      'GK',
      ...Array(4).fill('DF'),
      ...Array(4).fill('MF'),
      'FW',
      'FW',
    ]);
  });

  it('returns null for a slot past the last line', () => {
    expect(positionForSlot('3-4-2', 10)).toBeNull();
  });
});

describe('slotLayout', () => {
  it.each(['4-4-3', '3-3-3'])('returns null for %s', (formation) => {
    expect(slotLayout(formation)).toBeNull();
  });

  describe.each(FIXTURE_FORMATIONS)('%s', (formation) => {
    it('places slots 0–10 exactly once', () => {
      const slots = layoutOf(formation).map((point) => point.slot);
      expect(slots).toEqual(Array.from({ length: 11 }, (_, slot) => slot));
    });

    it('keeps every point inside the pitch', () => {
      for (const { x, y } of layoutOf(formation)) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(100);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(100);
      }
    });

    it('agrees with positionForSlot', () => {
      for (const point of layoutOf(formation)) {
        expect(point.position).toBe(positionForSlot(formation, point.slot));
      }
    });

    it('orders the GK lowest and each line above the last', () => {
      const [keeper] = layoutOf(formation);
      const lineYs = linesOf(formation).map((line) => line[0].y);

      expect(keeper.y).toBeGreaterThan(lineYs[0]);
      lineYs.slice(1).forEach((y, index) => {
        expect(y).toBeLessThan(lineYs[index]);
      });
      expect(lineYs).toHaveLength(formation.split('-').length);
    });

    it('mirrors each line around the centre', () => {
      for (const line of linesOf(formation)) {
        const xs = line.map((point) => point.x);
        xs.forEach((x, index) => {
          expect(x + xs[xs.length - 1 - index]).toBeCloseTo(100);
        });
      }
    });

    it('runs each line from screen right to left', () => {
      for (const line of linesOf(formation)) {
        line.slice(1).forEach((point, index) => {
          expect(point.x).toBeLessThan(line[index].x);
        });
      }
    });
  });
});
