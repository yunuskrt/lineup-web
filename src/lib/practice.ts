import type { QuitDialogCopy } from '@/components/game/QuitDialog';

export const PRACTICE_PARAM = 'practice';

// Backend R14 runs it; the URL only asks for it
export function isPracticeFrom(params: URLSearchParams): boolean {
  return params.get(PRACTICE_PARAM) === '1';
}

export function withPractice(
  params: URLSearchParams,
  isPractice: boolean,
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(PRACTICE_PARAM);
  if (isPractice) next.set(PRACTICE_PARAM, '1');
  return next;
}

// R14 ends a run in play when practice starts
export const PRACTICE_OVER_RUN_COPY: QuitDialogCopy = {
  title: 'Practise now?',
  detail: 'You left a run in play. Starting practice ends it.',
  confirmLabel: 'Practise',
  pendingLabel: 'Starting…',
  dismissLabel: 'Cancel',
};

// No clock to keep running, nothing saved
export const PRACTICE_QUIT_COPY: QuitDialogCopy = {
  title: 'End this practice run?',
  detail: "You'll see the summary. Practice runs aren't saved.",
  confirmLabel: 'End practice',
  pendingLabel: 'Ending…',
  dismissLabel: 'Keep practising',
};

const OPEN_RUN_KEY = 'lineup:open-run';

// This tab's unfinished timed run, if any
export function hasOpenRun(): boolean {
  try {
    return window.sessionStorage.getItem(OPEN_RUN_KEY) !== null;
  } catch {
    return false;
  }
}

export function markOpenRun(sessionId: string): void {
  try {
    window.sessionStorage.setItem(OPEN_RUN_KEY, sessionId);
  } catch {
    // No storage: no warning, never a crash
  }
}

export function clearOpenRun(): void {
  try {
    window.sessionStorage.removeItem(OPEN_RUN_KEY);
  } catch {
    // No storage: nothing to clear
  }
}
