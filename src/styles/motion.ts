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

export const MOTION_EASING = {
  ringSweep: 'linear',
  turnHandover: 'easeOut',
  // CSS `ease` as a cubic-bezier
  timerColorShift: [0.25, 0.1, 0.25, 1],
  skeletonPulse: 'easeInOut',
} as const;

export const REVEAL_TRANSITION_TYPE = 'spring';

export const SKELETON_PULSE_OPACITY = [1, 0.6, 1] as const;
