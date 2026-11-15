// Role tokens from theme.css that carry colour
export type RoleToken =
  | 'surface'
  | 'surface-raised'
  | 'surface-card'
  | 'surface-sage'
  | 'line'
  | 'marking'
  | 'fg'
  | 'fg-muted'
  | 'fg-dim'
  | 'on-accent'
  | 'focus'
  | 'brand'
  | 'you'
  | 'opponent'
  | 'found'
  | 'warning'
  | 'danger'
  | 'you-text'
  | 'opponent-text'
  | 'found-text'
  | 'warning-text'
  | 'danger-text'
  | 'block-lavender'
  | 'block-mint'
  | 'block-butter'
  | 'block-coral'
  | 'tag-green'
  | 'tag-amber'
  | 'tag-red'
  | 'tag-blue'
  | 'tag-purple'
  | 'tag-yellow'
  | 'tag-grey'
  | 'turf'
  | 'scoreboard'
  | 'on-scoreboard'
  | 'score-digits';

export type ContrastPair = {
  fg: RoleToken;
  bg: RoleToken;
  min: number;
  use: string;
};

// WCAG 2.2: body text, then large text and non-text
export const BODY_TEXT_MIN = 4.5;
export const LARGE_TEXT_MIN = 3;

const SURFACES: RoleToken[] = [
  'surface',
  'surface-raised',
  'surface-card',
  'surface-sage',
];

// Pastel fills; their text is on-accent
const FILLS: RoleToken[] = [
  'brand',
  'you',
  'opponent',
  'found',
  'warning',
  'danger',
  'block-lavender',
  'block-mint',
  'block-butter',
  'block-coral',
];

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
    ['you-text', 'opponent-text', 'found-text', 'warning-text', 'danger-text'],
    SURFACES,
    BODY_TEXT_MIN,
    'Handles, tags, cooldowns, error text',
  ),
  ...pairs(['on-accent'], FILLS, BODY_TEXT_MIN, 'Text on pastel fills'),
  ...pairs(
    ['fg'],
    [
      'tag-green',
      'tag-amber',
      'tag-red',
      'tag-blue',
      'tag-purple',
      'tag-yellow',
      'tag-grey',
    ],
    BODY_TEXT_MIN,
    'Tag text',
  ),
  ...pairs(
    ['fg-dim'],
    ['surface', 'surface-raised', 'surface-card'],
    LARGE_TEXT_MIN,
    'Large numerals, pips, no-crest shield',
  ),
  ...pairs(['line', 'focus'], SURFACES, LARGE_TEXT_MIN, 'Outlines, focus ring'),
  ...pairs(['line'], ['turf'], LARGE_TEXT_MIN, 'Pitch lines, slot outlines'),
  ...pairs(['fg-muted'], ['turf'], BODY_TEXT_MIN, 'Text on the turf'),
  ...pairs(
    ['on-scoreboard', 'score-digits'],
    ['scoreboard'],
    BODY_TEXT_MIN,
    'Scoreboard names, context and score',
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
