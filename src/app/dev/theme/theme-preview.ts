import {
  TYPE_CARD_TITLE,
  TYPE_DISPLAY,
  TYPE_NUMBER,
  TYPE_SECTION,
  TYPE_STICKER,
  TYPE_TITLE,
  TYPE_TITLE_LONG,
} from '@/styles/classes';
import type {
  ColorPrimitive,
  ColorRole,
  RadiusStep,
  SpacingStep,
  TypeRole,
  TypeStep,
} from '@/types/theme-preview';

export const COLOR_PRIMITIVES: readonly ColorPrimitive[] = [
  { name: 'cream', variable: '--cream', className: 'bg-(--cream)' },
  {
    name: 'peach-cream',
    variable: '--peach-cream',
    className: 'bg-(--peach-cream)',
  },
  { name: 'sage-pale', variable: '--sage-pale', className: 'bg-(--sage-pale)' },
  { name: 'sage', variable: '--sage', className: 'bg-(--sage)' },
  { name: 'caramel', variable: '--caramel', className: 'bg-(--caramel)' },
  { name: 'white', variable: '--white', className: 'bg-(--white)' },
  { name: 'lavender', variable: '--lavender', className: 'bg-(--lavender)' },
  { name: 'mint', variable: '--mint', className: 'bg-(--mint)' },
  { name: 'butter', variable: '--butter', className: 'bg-(--butter)' },
  { name: 'coral', variable: '--coral', className: 'bg-(--coral)' },
  { name: 'duel-blue', variable: '--duel-blue', className: 'bg-(--duel-blue)' },
  {
    name: 'duel-orange',
    variable: '--duel-orange',
    className: 'bg-(--duel-orange)',
  },
  {
    name: 'status-green',
    variable: '--status-green',
    className: 'bg-(--status-green)',
  },
  {
    name: 'status-amber',
    variable: '--status-amber',
    className: 'bg-(--status-amber)',
  },
  {
    name: 'status-red',
    variable: '--status-red',
    className: 'bg-(--status-red)',
  },
  { name: 'ink', variable: '--ink', className: 'bg-(--ink)' },
  { name: 'umber', variable: '--umber', className: 'bg-(--umber)' },
  { name: 'taupe', variable: '--taupe', className: 'bg-(--taupe)' },
  { name: 'blue-deep', variable: '--blue-deep', className: 'bg-(--blue-deep)' },
  {
    name: 'orange-deep',
    variable: '--orange-deep',
    className: 'bg-(--orange-deep)',
  },
  {
    name: 'green-deep',
    variable: '--green-deep',
    className: 'bg-(--green-deep)',
  },
  {
    name: 'amber-deep',
    variable: '--amber-deep',
    className: 'bg-(--amber-deep)',
  },
  { name: 'red-deep', variable: '--red-deep', className: 'bg-(--red-deep)' },
];

export const COLOR_ROLES: readonly ColorRole[] = [
  { role: 'surface', primitive: 'cream', className: 'bg-surface' },
  {
    role: 'surface-raised',
    primitive: 'peach-cream',
    className: 'bg-surface-raised',
  },
  { role: 'surface-card', primitive: 'white', className: 'bg-surface-card' },
  {
    role: 'surface-sage',
    primitive: 'sage-pale',
    className: 'bg-surface-sage',
  },
  { role: 'line', primitive: 'ink', className: 'bg-line' },
  { role: 'marking', primitive: 'sage', className: 'bg-marking' },
  { role: 'fg', primitive: 'ink', className: 'bg-fg' },
  { role: 'fg-muted', primitive: 'umber', className: 'bg-fg-muted' },
  { role: 'fg-dim', primitive: 'taupe', className: 'bg-fg-dim' },
  { role: 'on-accent', primitive: 'ink', className: 'bg-on-accent' },
  { role: 'focus', primitive: 'ink', className: 'bg-focus' },
  { role: 'brand', primitive: 'lavender', className: 'bg-brand' },
  { role: 'you', primitive: 'duel-blue', className: 'bg-you' },
  { role: 'opponent', primitive: 'duel-orange', className: 'bg-opponent' },
  { role: 'found', primitive: 'status-green', className: 'bg-found' },
  { role: 'warning', primitive: 'status-amber', className: 'bg-warning' },
  { role: 'danger', primitive: 'status-red', className: 'bg-danger' },
  { role: 'you-text', primitive: 'blue-deep', className: 'bg-you-text' },
  {
    role: 'opponent-text',
    primitive: 'orange-deep',
    className: 'bg-opponent-text',
  },
  { role: 'found-text', primitive: 'green-deep', className: 'bg-found-text' },
  {
    role: 'warning-text',
    primitive: 'amber-deep',
    className: 'bg-warning-text',
  },
  { role: 'danger-text', primitive: 'red-deep', className: 'bg-danger-text' },
  {
    role: 'block-lavender',
    primitive: 'lavender',
    className: 'bg-block-lavender',
  },
  { role: 'block-mint', primitive: 'mint', className: 'bg-block-mint' },
  { role: 'block-butter', primitive: 'butter', className: 'bg-block-butter' },
  { role: 'block-coral', primitive: 'coral', className: 'bg-block-coral' },
  {
    role: 'accent-caramel',
    primitive: 'caramel',
    className: 'bg-accent-caramel',
  },
];

export const TYPE_SCALE: readonly TypeStep[] = [
  { className: 'text-12', rem: '0.75rem' },
  { className: 'text-14', rem: '0.875rem' },
  { className: 'text-16', rem: '1rem' },
  { className: 'text-20', rem: '1.25rem' },
  { className: 'text-24', rem: '1.5rem' },
  { className: 'text-28', rem: '1.75rem' },
  { className: 'text-30', rem: '1.875rem' },
  { className: 'text-32', rem: '2rem' },
  { className: 'text-34', rem: '2.125rem' },
  { className: 'text-40', rem: '2.5rem' },
  { className: 'text-48', rem: '3rem' },
  { className: 'text-64', rem: '4rem', use: 'Countdown' },
  { className: 'text-72', rem: '4.5rem', use: 'Display from md' },
];

export const SPACING_SCALE: readonly SpacingStep[] = [
  { px: 4, className: 'w-1' },
  { px: 8, className: 'w-2' },
  { px: 12, className: 'w-3' },
  { px: 16, className: 'w-4' },
  { px: 24, className: 'w-6' },
  { px: 32, className: 'w-8' },
  { px: 48, className: 'w-12' },
  { px: 64, className: 'w-16' },
];

export const RADIUS_SCALE: readonly RadiusStep[] = [
  { className: 'rounded-sm', value: '6px', use: 'Small marks, links' },
  { className: 'rounded-md', value: '10px', use: 'Buttons, inputs, cards' },
  { className: 'rounded-lg', value: '16px', use: 'Panels' },
  { className: 'rounded-full', value: 'full', use: 'Chips, avatars' },
];

export const LATIN_EXTENDED_SAMPLE = 'İbrahimović Şahin Özil Łukasz Čech';

export const TYPE_ROLES: readonly TypeRole[] = [
  {
    name: 'TYPE_DISPLAY',
    detail: '800 · width 112, 125 from md · 34 / 72px',
    className: TYPE_DISPLAY,
    sample: 'Know the XI. Beat the Clock.',
  },
  {
    name: 'TYPE_TITLE',
    detail: '800 · width 112 · 30 / 40px',
    className: TYPE_TITLE,
    sample: 'Perfect clear',
  },
  {
    name: 'TYPE_SECTION',
    detail: '800 · width 112 · 24 / 28px',
    className: TYPE_SECTION,
    sample: 'Named in order',
  },
  {
    name: 'TYPE_CARD_TITLE',
    detail: '800 · width 112 · 20px',
    className: TYPE_CARD_TITLE,
    sample: 'Run ended',
  },
  {
    name: 'TYPE_TITLE_LONG',
    detail: '700 · width 100 · 20px',
    className: TYPE_TITLE_LONG,
    sample: 'Hosting a room needs Pro',
  },
  {
    name: 'TYPE_NUMBER',
    detail: '900 · width 125 · tabular, slashed zero',
    className: `${TYPE_NUMBER} text-64`,
    sample: '15 · 3–3 · 10',
  },
  {
    name: 'TYPE_STICKER',
    detail: '800 · width 112 · uppercase 12px',
    className: TYPE_STICKER,
    sample: 'Your turn',
  },
];

export const COUNTDOWN_SAMPLE: readonly number[] = Array.from(
  { length: 16 },
  (_, index) => 15 - index,
);
