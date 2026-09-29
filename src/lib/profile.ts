import { accuracyLabel, summaryTitle } from '@/lib/summary';
import type { DuelOutcome } from '@/types/game';
import type { HistoryEntry, UserStats } from '@/types/profile';
import type {
  DuelRecord,
  HistoryTone,
  RecordShares,
} from '@/types/profile-screen';

const DUEL_OUTCOME_LABELS: Record<DuelOutcome, string> = {
  win: 'Win',
  loss: 'Loss',
  draw: 'Draw',
  forfeit_win: 'Forfeit win',
};

const DUEL_OUTCOME_TONES: Record<DuelOutcome, HistoryTone> = {
  win: 'win',
  loss: 'loss',
  draw: 'draw',
  forfeit_win: 'win',
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Fixed names: ICU builds disagree on "Sep"
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function duelRecord(stats: UserStats): DuelRecord {
  const { wins, draws, losses } = stats;
  return { wins, draws, losses, total: wins + draws + losses };
}

export function recordShares(stats: UserStats): RecordShares {
  const { wins, draws, losses, total } = duelRecord(stats);
  if (total === 0) return { wins: 0, draws: 0, losses: 0 };
  return { wins: wins / total, draws: draws / total, losses: losses / total };
}

export function duelCountLabel(total: number): string {
  if (total === 0) return 'No duels yet';
  return total === 1 ? '1 duel' : `${total} duels`;
}

// `played` counts duels too; see the W24a notes
export function soloRunCount(stats: UserStats): number {
  return Math.max(0, stats.played - duelRecord(stats).total);
}

export function historyOutcomeLabel(entry: HistoryEntry): string {
  return entry.mode === 'solo'
    ? summaryTitle(entry.outcome)
    : DUEL_OUTCOME_LABELS[entry.outcome];
}

export function historyTone(entry: HistoryEntry): HistoryTone {
  if (entry.mode === 'duel') return DUEL_OUTCOME_TONES[entry.outcome];
  return entry.outcome === 'perfect_clear' ? 'clear' : 'neutral';
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

// Calendar days in the viewer's own time zone
export function playedAtLabel(playedAt: string, now: Date): string {
  const played = new Date(playedAt);
  const days = Math.round((startOfDay(now) - startOfDay(played)) / DAY_MS);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';

  const dayMonth = `${played.getDate()} ${MONTHS[played.getMonth()]}`;
  return played.getFullYear() === now.getFullYear()
    ? dayMonth
    : `${dayMonth} ${played.getFullYear()}`;
}

export function accuracyStat(stats: UserStats): string {
  return stats.played === 0 ? '—' : accuracyLabel(stats.accuracy);
}

export function favouriteClubStat(stats: UserStats): string {
  return stats.favouriteClub?.name ?? 'None yet';
}
