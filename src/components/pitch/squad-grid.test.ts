import { describe, expect, it } from 'vitest';
import { discSizeClass, slotWidthClass } from '@/components/pitch/SquadGrid';

const ROOMY = '[--disc:clamp(28px,12cqw,72px)]';
const MEDIUM = '[--disc:clamp(20px,8cqw,56px)]';
const COMPACT = '[--disc:clamp(18px,6.5cqw,40px)]';

describe('discSizeClass', () => {
  it.each(['4-4-2', '4-3-3', '3-5-2', '3-4-3'])(
    'gives three-line %s the largest discs',
    (formation) => {
      expect(discSizeClass(formation)).toBe(ROOMY);
    },
  );

  it.each(['4-2-3-1', '4-1-4-1'])(
    'shrinks the discs for four-line %s',
    (formation) => {
      expect(discSizeClass(formation)).toBe(MEDIUM);
    },
  );

  it('keeps five lines and more at the smallest size', () => {
    expect(discSizeClass('4-1-2-1-2')).toBe(COMPACT);
    expect(discSizeClass('3-1-2-1-2-1')).toBe(COMPACT);
  });

  it('falls back to the roomy size for an unreadable formation', () => {
    expect(discSizeClass('4-4')).toBe(ROOMY);
    expect(discSizeClass('nonsense')).toBe(ROOMY);
  });
});

describe('slotWidthClass', () => {
  it('sizes slots by the widest line', () => {
    expect(slotWidthClass('4-3-3')).toBe('w-[22%]');
    expect(slotWidthClass('3-5-2')).toBe('w-[18%]');
    expect(slotWidthClass('5-3-2')).toBe('w-[18%]');
  });

  it('keeps narrow lines at the widest slot', () => {
    expect(slotWidthClass('3-3-3-1')).toBe('w-[24%]');
  });
});
