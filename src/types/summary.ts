import type { ClubRef } from '@/types/match';

export type ClubNameKey = keyof Pick<ClubRef, 'name' | 'shortName'>;

export type RoundTimeStats = { averageMs: number; fastestMs: number };
