import type { Suggestion } from '@/lib/suggestions';

export const NO_SUGGESTIONS: readonly Suggestion[] = [];

export const STILL_STAGE = {
  value: '',
  status: 'live',
  shakeKey: 0,
  suggestions: NO_SUGGESTIONS,
  toast: null,
  isFading: false,
} as const;
