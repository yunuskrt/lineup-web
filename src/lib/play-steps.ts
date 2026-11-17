import { FILTER_PARAMS, withQuery } from '@/lib/filters';
import { isPracticeFrom, modeOf, PRACTICE_PARAM } from '@/lib/practice';
import type { ModeOption, PlayMode } from '@/types/play';

export const STEP_PARAM = 'step';

const PLAY_PATH = '/play';

// Step 1's join row, as a link target
export const JOIN_ROW_ID = 'play-a-friend';

export type PlayStep = 'mode' | 'filters' | 'start';

export const PLAY_STEPS: readonly PlayStep[] = ['mode', 'filters', 'start'];

export const PLAY_STEP_NAMES: Record<PlayStep, string> = {
  mode: 'Mode',
  filters: 'Filters',
  start: 'Start',
};

export const MODE_OPTION_NAMES: Record<ModeOption, string> = {
  solo: 'Solo',
  duel: 'Duel',
  practice: 'Practice',
};

// On /play a missing mode means none picked
export function playModeOf(param: string | null): PlayMode | null {
  return param === 'solo' || param === 'duel' ? param : null;
}

// Practice is a solo run, even with no mode
export function modeOptionFrom(params: URLSearchParams): ModeOption | null {
  const mode = playModeOf(params.get(FILTER_PARAMS.mode));
  if (mode !== 'duel' && isPracticeFrom(params)) return 'practice';
  return mode;
}

export function withModeOption(
  params: URLSearchParams,
  option: ModeOption | null,
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(FILTER_PARAMS.mode);
  next.delete(PRACTICE_PARAM);
  if (!option) return next;
  const { mode, practice } = modeOf(option);
  next.set(FILTER_PARAMS.mode, mode);
  if (practice) next.set(PRACTICE_PARAM, '1');
  return next;
}

// Later steps need a mode; else step 1
export function playStepFrom(
  params: URLSearchParams,
  hasMode = modeOptionFrom(params) !== null,
): PlayStep {
  const step = params.get(STEP_PARAM);
  if (!hasMode) return 'mode';
  return step === 'filters' || step === 'start' ? step : 'mode';
}

export function withStep(
  params: URLSearchParams,
  step: PlayStep,
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(STEP_PARAM);
  if (step !== 'mode') next.set(STEP_PARAM, step);
  return next;
}

export type StepProgress = { hasMode: boolean; hasFilters: boolean };

// Filled: its choice is made and valid
export function isStepFilled(step: PlayStep, progress: StepProgress): boolean {
  if (step === 'mode') return progress.hasMode;
  if (step === 'filters') return progress.hasMode && progress.hasFilters;
  return false;
}

// Reachable once every earlier step is filled
export function isStepReachable(
  step: PlayStep,
  progress: StepProgress,
): boolean {
  const index = PLAY_STEPS.indexOf(step);
  return PLAY_STEPS.slice(0, index).every((earlier) =>
    isStepFilled(earlier, progress),
  );
}

// A step of /play, carrying what's chosen
export function playPath(
  params: URLSearchParams,
  step: PlayStep,
  hash?: string,
): string {
  const path = withQuery(PLAY_PATH, withStep(params, step));
  return hash ? `${path}#${hash}` : path;
}
