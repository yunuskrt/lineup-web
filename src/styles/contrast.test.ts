import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BODY_TEXT_MIN,
  CONTRAST_EXCEPTIONS,
  CONTRAST_PAIRS,
  contrastRatio,
  LARGE_TEXT_MIN,
  relativeLuminance,
  type RoleToken,
} from '@/styles/contrast';

const AAA = 7;

function readCss(name: string): string {
  return readFileSync(join(process.cwd(), 'src/styles', name), 'utf8');
}

// Primitive hex values, as tokens.css ships them
const PRIMITIVES = new Map(
  [...readCss('tokens.css').matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map(
    ([, name, hex]) => [name, hex.toLowerCase()],
  ),
);

// Roles that point straight at a primitive
const ROLES = new Map(
  [...readCss('theme.css').matchAll(/--([\w-]+):\s*var\(--([\w-]+)\);/g)].map(
    ([, role, target]) => [role, target],
  ),
);

function hexOf(role: RoleToken): string {
  let name: string = role;
  for (let hop = 0; hop < 4 && ROLES.has(name); hop += 1) {
    name = ROLES.get(name) ?? name;
  }
  const hex = PRIMITIVES.get(name);
  if (!hex) throw new Error(`${role} does not resolve to a primitive`);
  return hex;
}

describe('relativeLuminance', () => {
  it('spans black to white', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('refuses anything but a 6-digit hex', () => {
    expect(() => relativeLuminance('#fff')).toThrow();
    expect(() => relativeLuminance('red')).toThrow();
  });
});

describe('contrastRatio', () => {
  it('reads 21:1 for black on white, in either order', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  // The familiar AA boundary grey and pure primaries
  it.each([
    ['#767676', '#ffffff', 4.54],
    ['#ff0000', '#ffffff', 4.0],
    ['#0000ff', '#ffffff', 8.59],
    ['#00ff00', '#000000', 15.3],
  ])('reads %s on %s as %s:1', (a, b, ratio) => {
    expect(contrastRatio(a, b)).toBeCloseTo(ratio, 1);
  });

  it('accepts upper-case hex', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  });

  it('reads 1:1 for a colour on itself', () => {
    expect(contrastRatio('#27352c', '#27352c')).toBe(1);
  });
});

describe('the shipped palette', () => {
  it('lists each pair once', () => {
    const keys = CONTRAST_PAIRS.map(({ fg, bg }) => `${fg}/${bg}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('resolves every role in the pairs to a hex value', () => {
    for (const { fg, bg } of CONTRAST_PAIRS) {
      expect(() => hexOf(fg), fg).not.toThrow();
      expect(() => hexOf(bg), bg).not.toThrow();
    }
  });

  it.each(CONTRAST_PAIRS)(
    '$fg on $bg meets $min:1 ($use)',
    ({ fg, bg, min }) => {
      expect(contrastRatio(hexOf(fg), hexOf(bg))).toBeGreaterThanOrEqual(min);
    },
  );

  // theme.md § Contrast verdicts, against pitch-950
  it.each([
    ['fg', AAA],
    ['fg-muted', AAA],
    ['brand', AAA],
    ['found', AAA],
    ['opponent', BODY_TEXT_MIN],
    ['danger', BODY_TEXT_MIN],
    ['fg-dim', LARGE_TEXT_MIN],
  ] as const)('keeps %s at the verdict theme.md gives it', (role, min) => {
    expect(contrastRatio(hexOf(role), hexOf('surface'))).toBeGreaterThanOrEqual(
      min,
    );
  });
});

describe('contrast exceptions', () => {
  // A passing pair belongs in CONTRAST_PAIRS instead
  it.each(CONTRAST_EXCEPTIONS)(
    '$fg on $bg still falls short ($use)',
    ({ fg, bg, min }) => {
      expect(contrastRatio(hexOf(fg), hexOf(bg))).toBeLessThan(min);
    },
  );

  it('never excuses a pair that is also required', () => {
    for (const exception of CONTRAST_EXCEPTIONS) {
      const clash = CONTRAST_PAIRS.find(
        (pair) =>
          pair.fg === exception.fg &&
          pair.bg === exception.bg &&
          pair.min >= exception.min,
      );
      expect(clash, `${exception.fg} on ${exception.bg}`).toBeUndefined();
    }
  });
});
