import { matchDateLabel } from '@/lib/summary';
import type { ClubRef, MatchInPlay, Side } from '@/types/match';

export type HeaderSide = {
  club: ClubRef;
  score: number;
  // The side whose XI is being named
  isNamed: boolean;
};

export type MatchHeaderView = {
  home: HeaderSide;
  away: HeaderSide;
  competition: string;
  date: string;
  namingLabel: string;
};

function headerSide(match: MatchInPlay, side: Side): HeaderSide {
  return {
    club: match[side],
    score: match.score[side],
    isNamed: match.side === side,
  };
}

export function matchHeaderView(match: MatchInPlay): MatchHeaderView {
  return {
    home: headerSide(match, 'home'),
    away: headerSide(match, 'away'),
    competition: match.competition.name,
    date: matchDateLabel(match.date),
    namingLabel: `You're naming ${match[match.side].name}'s starting XI.`,
  };
}
