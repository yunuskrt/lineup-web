import type {
  ColorPrimitive,
  ColorRole,
  RadiusStep,
  SpacingStep,
  TypeStep,
} from '@/types/theme-preview';

export const COLOR_PRIMITIVES: readonly ColorPrimitive[] = [
  { name: 'pitch-950', variable: '--pitch-950', className: 'bg-(--pitch-950)' },
  { name: 'pitch-900', variable: '--pitch-900', className: 'bg-(--pitch-900)' },
  { name: 'pitch-800', variable: '--pitch-800', className: 'bg-(--pitch-800)' },
  { name: 'pitch-700', variable: '--pitch-700', className: 'bg-(--pitch-700)' },
  { name: 'pitch-600', variable: '--pitch-600', className: 'bg-(--pitch-600)' },
  { name: 'bone', variable: '--bone', className: 'bg-(--bone)' },
  { name: 'muted', variable: '--muted', className: 'bg-(--muted)' },
  { name: 'dim', variable: '--dim', className: 'bg-(--dim)' },
  {
    name: 'floodlight',
    variable: '--floodlight',
    className: 'bg-(--floodlight)',
  },
  { name: 'away', variable: '--away', className: 'bg-(--away)' },
  { name: 'turf', variable: '--turf', className: 'bg-(--turf)' },
  { name: 'ember', variable: '--ember', className: 'bg-(--ember)' },
  { name: 'red-card', variable: '--red-card', className: 'bg-(--red-card)' },
];

export const COLOR_ROLES: readonly ColorRole[] = [
  { role: 'surface', primitive: 'pitch-950', className: 'bg-surface' },
  {
    role: 'surface-raised',
    primitive: 'pitch-900',
    className: 'bg-surface-raised',
  },
  {
    role: 'surface-card',
    primitive: 'pitch-800',
    className: 'bg-surface-card',
  },
  { role: 'line', primitive: 'pitch-700', className: 'bg-line' },
  { role: 'marking', primitive: 'pitch-600', className: 'bg-marking' },
  { role: 'fg', primitive: 'bone', className: 'bg-fg' },
  { role: 'fg-muted', primitive: 'muted', className: 'bg-fg-muted' },
  { role: 'fg-dim', primitive: 'dim', className: 'bg-fg-dim' },
  { role: 'on-accent', primitive: 'pitch-950', className: 'bg-on-accent' },
  { role: 'brand', primitive: 'floodlight', className: 'bg-brand' },
  { role: 'you', primitive: 'floodlight', className: 'bg-you' },
  { role: 'opponent', primitive: 'away', className: 'bg-opponent' },
  { role: 'found', primitive: 'turf', className: 'bg-found' },
  { role: 'warning', primitive: 'ember', className: 'bg-warning' },
  { role: 'danger', primitive: 'red-card', className: 'bg-danger' },
];

export const TYPE_SCALE: readonly TypeStep[] = [
  { className: 'text-12', rem: '0.75rem' },
  { className: 'text-14', rem: '0.875rem' },
  { className: 'text-16', rem: '1rem' },
  { className: 'text-20', rem: '1.25rem' },
  { className: 'text-24', rem: '1.5rem' },
  { className: 'text-32', rem: '2rem' },
  { className: 'text-48', rem: '3rem' },
  { className: 'text-64', rem: '4rem', use: 'Countdown only' },
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
  { className: 'rounded-sm', value: '4px', use: 'Chips, inputs' },
  { className: 'rounded-md', value: '8px', use: 'Cards' },
  { className: 'rounded-lg', value: '12px', use: 'Panels' },
  { className: 'rounded-full', value: 'full', use: 'Badges only' },
];

export const LATIN_EXTENDED_SAMPLE = 'İbrahimović Şahin Özil Łukasz Čech';

export const COUNTDOWN_SAMPLE: readonly number[] = Array.from(
  { length: 16 },
  (_, index) => 15 - index,
);
