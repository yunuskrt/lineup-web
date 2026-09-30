// Role tokens from theme.css that carry colour
export type RoleToken =
  | 'surface'
  | 'surface-raised'
  | 'surface-card'
  | 'line'
  | 'marking'
  | 'fg'
  | 'fg-muted'
  | 'fg-dim'
  | 'on-accent'
  | 'brand'
  | 'you'
  | 'opponent'
  | 'found'
  | 'warning'
  | 'danger';

export type ContrastPair = {
  fg: RoleToken;
  bg: RoleToken;
  min: number;
  use: string;
};

// WCAG 2.2: body text, then large text and non-text
export const BODY_TEXT_MIN = 4.5;
export const LARGE_TEXT_MIN = 3;

const SURFACES: RoleToken[] = ['surface', 'surface-raised', 'surface-card'];
const PANELS: RoleToken[] = ['surface-raised', 'surface-card'];

function pairs(
  fgs: RoleToken[],
  bgs: RoleToken[],
  min: number,
  use: string,
): ContrastPair[] {
  return fgs.flatMap((fg) => bgs.map((bg) => ({ fg, bg, min, use })));
}

// Every foreground and background pair the app ships
export const CONTRAST_PAIRS: ContrastPair[] = [
  ...pairs(['fg', 'fg-muted'], SURFACES, BODY_TEXT_MIN, 'Body text'),
  ...pairs(
    ['you', 'opponent', 'found', 'danger'],
    SURFACES,
    BODY_TEXT_MIN,
    'Handles, tags, error text',
  ),
  ...pairs(['warning'], PANELS, BODY_TEXT_MIN, 'Cooldown and reconnect'),
  ...pairs(
    ['on-accent'],
    ['brand', 'found', 'warning', 'opponent'],
    BODY_TEXT_MIN,
    'Buttons, turn chips, win cards',
  ),
  ...pairs(
    ['fg-dim'],
    ['surface', 'surface-raised'],
    LARGE_TEXT_MIN,
    'Large numerals, pips',
  ),
];

export type ContrastException = ContrastPair & { why: string };

// Below the minimum on purpose; WCAG exempts these
export const CONTRAST_EXCEPTIONS: ContrastException[] = [
  {
    fg: 'fg-dim',
    bg: 'surface-card',
    min: BODY_TEXT_MIN,
    use: 'Disabled input text and placeholders',
    why: 'Inactive controls; each field has a visible label',
  },
  {
    fg: 'fg-dim',
    bg: 'surface',
    min: BODY_TEXT_MIN,
    use: 'Unrevealed slot position labels',
    why: 'Incidental and aria-hidden; the grid is labelled',
  },
];

const HEX = /^#([0-9a-f]{6})$/i;

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const match = HEX.exec(hex);
  if (!match) throw new Error(`Not a 6-digit hex colour: ${hex}`);
  const value = Number.parseInt(match[1], 16);
  const [r, g, b] = [value >> 16, (value >> 8) & 0xff, value & 0xff].map(
    channel,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (light + 0.05) / (dark + 0.05);
}
