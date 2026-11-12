import type { ApiError } from '@/types/api';
import type { SoloAllowance } from '@/types/solo';

// The player's clock; the server resets at UTC
export function resetTimeOf(resetsAt: number, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(resetsAt);
}

// Null when unlimited
export function runsLeft(allowance: SoloAllowance): number | null {
  if (allowance.limit === null) return null;
  return Math.max(0, allowance.limit - allowance.used);
}

export function isSoloCapped(allowance: SoloAllowance | null): boolean {
  return allowance !== null && runsLeft(allowance) === 0;
}

// Only when capped: the message and when it lifts
export function capLine(
  allowance: SoloAllowance | null,
  timeZone?: string,
): string | null {
  if (!allowance || !isSoloCapped(allowance)) return null;
  return `You've played your ${allowance.limit} solo runs today. More at ${resetTimeOf(allowance.resetsAt, timeZone)}.`;
}

// Nothing while unlimited, so nothing says Pro
export function allowanceLine(
  allowance: SoloAllowance | null,
  timeZone?: string,
): string | null {
  if (!allowance || allowance.limit === null) return null;
  const left = runsLeft(allowance);
  if (left === 0) return capLine(allowance, timeZone);
  return `${left} of ${allowance.limit} solo runs left today`;
}

// A floor, so a reset just passed can't spin
export const RESET_REFETCH_FLOOR_MS = 1_000;

// At 0, ask again when the server's day turns
export function refetchAtReset(
  allowance: SoloAllowance | null,
  now: number,
): number | false {
  if (!allowance || !isSoloCapped(allowance)) return false;
  return Math.max(RESET_REFETCH_FLOOR_MS, allowance.resetsAt - now);
}

export function isDailyCap(error: ApiError): boolean {
  return error.code === 'forbidden' && error.reason === 'daily_cap';
}
