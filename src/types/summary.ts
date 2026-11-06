import type { ClubRef } from '@/types/match';

export type ClubNameKey = keyof Pick<ClubRef, 'name' | 'shortName'>;

export type NamedTiming = { order: number; elapsedMs: number };

export type NamedOrder<T extends NamedTiming> = {
  rows: T[];
  // Null with no rows
  fastestIndex: number | null;
};
