import type {
  CoinFlipSource,
  DuelActor,
  DuelPlayer,
  FilterSubmission,
} from '@/types/duel';

export type FilterSummaryLine = { label: string; value: string };

export type FilterSummary = FilterSummaryLine[];

export type DuelLobbyView =
  | { step: 'searching' }
  | {
      step: 'roomWaiting';
      code: string;
      expiresAt: number;
      filters: FilterSummary;
    }
  | { step: 'roomExpired' }
  | { step: 'joining'; code: string }
  | { step: 'paired'; opponent: DuelPlayer }
  | {
      step: 'filters';
      yours: FilterSummary;
      submission: FilterSubmission;
      isLocking?: boolean;
    }
  | {
      step: 'coinFlip';
      source: CoinFlipSource;
      winner: DuelActor;
      applied: FilterSummary;
      opponent: DuelPlayer;
    }
  | { step: 'noOpponent' };

export type DuelLobbyStep = DuelLobbyView['step'];

export type LobbyAction =
  'cancel' | 'lock' | 'solo' | 'searchAgain' | 'newRoom';
