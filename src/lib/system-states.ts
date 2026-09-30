import type { ApiError, EmptyPoolReason } from '@/types/api';
import type { CanvasGateView } from '@/types/canvas';
import type { ConnectionState } from '@/types/duel';

export type WidenReason = Exclude<EmptyPoolReason, 'combination'>;

export const CHANGE_FILTERS = 'Change filters';

// Null retry time still locks for a beat
export const DEFAULT_COOLDOWN_MS = 1_000;

const COMBINATION_TITLE = 'No match for these filters together';

const WIDEN_COPY: Record<WidenReason, { title: string; action: string }> = {
  competition: {
    title: 'No match in those competitions',
    action: 'Include every competition',
  },
  club: { title: 'No match for those clubs', action: 'Include every club' },
  era: { title: 'No match in those seasons', action: 'Include every season' },
};

export function widenReasonOf(error: ApiError): WidenReason | null {
  if (error.code !== 'empty_pool') return null;
  const reason = error.emptyBecause;
  return reason && reason !== 'combination' ? reason : null;
}

// Names the filter; the detail is the server's
export function emptyPoolGate(
  error: ApiError,
  canWiden = true,
): CanvasGateView {
  const reason = canWiden ? widenReasonOf(error) : null;
  if (!reason) {
    return {
      title: COMBINATION_TITLE,
      detail: error.message,
      actionLabel: CHANGE_FILTERS,
    };
  }

  return {
    title: WIDEN_COPY[reason].title,
    detail: error.message,
    actionLabel: WIDEN_COPY[reason].action,
    secondaryActionLabel: CHANGE_FILTERS,
  };
}

// Display only; the server still enforces it
export function cooldownUntil(error: ApiError, now: number): number {
  return now + (error.retryAfterMs ?? DEFAULT_COOLDOWN_MS);
}

// A second report of one lockout keeps the first
export function heldCooldown(
  current: number | null,
  error: ApiError,
  now: number,
): number {
  return current !== null && current > now
    ? current
    : cooldownUntil(error, now);
}

export function cooldownSecondsLeft(msLeft: number): number {
  return Math.max(1, Math.ceil(msLeft / 1000));
}

export function cooldownLabel(msLeft: number): string {
  return `Too many guesses. Try again in ${cooldownSecondsLeft(msLeft)}s`;
}

export function cooldownAnnouncement(msLeft: number): string {
  const seconds = cooldownSecondsLeft(msLeft);
  const unit = seconds === 1 ? 'second' : 'seconds';
  return `Too many guesses. Try again in ${seconds} ${unit}.`;
}

export const RECONNECTING_TITLE = 'Reconnecting';

// Said outright, or the dim reads as a freeze
export function reconnectingDetail(secondsLeft: number): string {
  return `The clock keeps running. If you're not back in ${secondsLeft}s, you forfeit the duel.`;
}

// No action: the server decides when you're back
export function reconnectingGate(
  connection: ConnectionState | null,
): CanvasGateView | null {
  if (connection?.status !== 'reconnecting') return null;
  const deadline = connection.reconnectDeadline;
  if (deadline === null) return { title: RECONNECTING_TITLE };
  return {
    title: RECONNECTING_TITLE,
    countdown: { deadline, label: reconnectingDetail },
  };
}
