export const MOTION_DURATION_MS = {
  reveal: 320,
  turnHandover: 240,
  lifeLost: 480,
  inputShake: 240,
  alreadyFoundPulse: 480,
  toastVisible: 1600,
  gateFade: 240,
  timerColorShift: 200,
  skeletonPulse: 1600,
} as const;

// Motion takes seconds
export const MOTION_SECONDS = Object.fromEntries(
  Object.entries(MOTION_DURATION_MS).map(([key, ms]) => [key, ms / 1000]),
) as Record<keyof typeof MOTION_DURATION_MS, number>;

export const MOTION_EASING = {
  ringSweep: 'linear',
  turnHandover: 'easeOut',
  // CSS `ease` as a cubic-bezier
  timerColorShift: [0.25, 0.1, 0.25, 1],
  skeletonPulse: 'easeInOut',
} as const;

export const REVEAL_TRANSITION_TYPE = 'spring';

export const REVEAL_SPRING = {
  type: REVEAL_TRANSITION_TYPE,
  visualDuration: MOTION_SECONDS.reveal,
  bounce: 0.25,
} as const;

export const SKELETON_PULSE_OPACITY = [1, 0.6, 1] as const;

export const SKELETON_PULSE = {
  duration: MOTION_SECONDS.skeletonPulse,
  ease: MOTION_EASING.skeletonPulse,
  repeat: Infinity,
} as const;

// Every animated effect, as theme.md names it
export const MOTION_EFFECTS = [
  'ringSweep',
  'ringCriticalPulse',
  'timerColorShift',
  'revealSpring',
  'revealFlash',
  'alreadyFoundPulse',
  'slotMove',
  'skeletonPulse',
  'lifeShake',
  'lifeFill',
  'lifeLostFlash',
  'inputShake',
  'inputRejectTint',
  'inputSpinner',
  'toastRise',
  'toastFade',
  'turnChipSlide',
  'turnBorderShift',
  'gateFade',
  'lobbyPulse',
  'coinFlipScale',
] as const;

export type MotionEffect = (typeof MOTION_EFFECTS)[number];

export type ReducedMotion = 'keep' | 'drop';

// A scalpel: drop movement, keep information
export const REDUCED_MOTION_POLICY: Record<MotionEffect, ReducedMotion> = {
  ringSweep: 'keep',
  ringCriticalPulse: 'drop',
  timerColorShift: 'keep',
  revealSpring: 'drop',
  revealFlash: 'keep',
  alreadyFoundPulse: 'keep',
  slotMove: 'drop',
  skeletonPulse: 'drop',
  lifeShake: 'drop',
  lifeFill: 'keep',
  lifeLostFlash: 'keep',
  inputShake: 'drop',
  inputRejectTint: 'keep',
  inputSpinner: 'keep',
  toastRise: 'drop',
  toastFade: 'keep',
  turnChipSlide: 'drop',
  turnBorderShift: 'keep',
  gateFade: 'keep',
  lobbyPulse: 'drop',
  coinFlipScale: 'drop',
};

// Null before the preference is read: animate
export function motionFor(
  effect: MotionEffect,
  isReduced: boolean | null,
): boolean {
  return REDUCED_MOTION_POLICY[effect] === 'keep' || !isReduced;
}
