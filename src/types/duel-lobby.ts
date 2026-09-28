import type { DuelActor, DuelPlayer, FilterSubmission } from '@/types/duel';

export type FilterSummaryLine = { label: string; value: string };

export type FilterSummary = FilterSummaryLine[];

export type DuelLobbyView =
  | { step: 'searching' }
  | { step: 'paired'; opponent: DuelPlayer }
  | {
      step: 'filters';
      yours: FilterSummary;
      submission: FilterSubmission;
      isLocking?: boolean;
    }
  | {
      step: 'coinFlip';
      winner: DuelActor;
      applied: FilterSummary;
      opponent: DuelPlayer;
    }
  | { step: 'noOpponent' };

export type DuelLobbyStep = DuelLobbyView['step'];

export type LobbyAction = 'cancel' | 'lock' | 'solo' | 'searchAgain';
