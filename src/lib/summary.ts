import type { SoloEndView } from '@/types/canvas';
import type { SoloEndReason } from '@/types/game';
import type { MatchIdentity } from '@/types/match';
import type { RevealedPlayer } from '@/types/player';
import type { ClubNameKey, NamedOrder, NamedTiming } from '@/types/summary';

const SUMMARY_TITLES: Record<SoloEndReason, string> = {
  perfect_clear: 'Perfect clear',
  lives_out: 'Run over',
  quit: 'Run ended',
};

// Fixed locale and zone: server and client agree
const MATCH_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function summaryTitle(endReason: SoloEndReason): string {
  return SUMMARY_TITLES[endReason];
}

export function scoreline(
  identity: MatchIdentity,
  nameKey: ClubNameKey = 'name',
): string {
  const { home, away, score } = identity;
  return `${home[nameKey]} ${score.home}–${score.away} ${away[nameKey]}`;
}

export function matchDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return MATCH_DATE.format(Date.UTC(year, month - 1, day));
}

export function matchContext(identity: MatchIdentity): string {
  const { competition, stage, date } = identity;
  const event = stage
    ? `${competition.name} ${stage.charAt(0).toLowerCase()}${stage.slice(1)}`
    : competition.name;
  return `${event}, ${matchDateLabel(date)}`;
}

export function matchSubtitle(identity: MatchIdentity): string {
  const context = matchContext(identity);
  return identity.nickname ? `${identity.nickname}: ${context}` : context;
}

export function accuracyLabel(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function roundSecondsLabel(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

// Hidden until the player asks to see them
export function missedOnPitch(
  end: SoloEndView | null,
): RevealedPlayer[] | undefined {
  if (end?.status !== 'ready' || !end.isMissedRevealed) return undefined;
  return end.summary.missed ?? undefined;
}

// The server's order, shown as is; a tie keeps the first
export function namedOrder<T extends NamedTiming>(found: T[]): NamedOrder<T> {
  const rows = [...found].sort((a, b) => a.order - b.order);
  let fastestIndex: number | null = null;
  rows.forEach((row, index) => {
    if (fastestIndex === null || row.elapsedMs < rows[fastestIndex].elapsedMs) {
      fastestIndex = index;
    }
  });
  return { rows, fastestIndex };
}
