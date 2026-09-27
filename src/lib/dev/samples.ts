import {
  FIRST_SEASON_START,
  LAST_SEASON_START,
} from '@/lib/api/schemas/common';
import { slotLayout } from '@/lib/formation';
import type { FilterOptions } from '@/types/catalog';
import type { DuelPlayer } from '@/types/duel';
import type { Filters } from '@/types/filters';
import type { GuessOutcome } from '@/types/game';
import type { MaskedMatch, MatchIdentity } from '@/types/match';
import type { RevealedPlayer } from '@/types/player';

export const SAMPLE_MATCH: MaskedMatch = {
  id: 'sample-match',
  side: 'home',
  team: {
    id: 'sample-club',
    name: 'Northgate United',
    shortName: 'Northgate',
    crestUrl: null,
  },
  formation: '4-4-2',
};

// The match SAMPLE_MATCH masks, revealed at the end
export const SAMPLE_IDENTITY: MatchIdentity = {
  id: SAMPLE_MATCH.id,
  competition: { id: 'sample-cup', kind: 'ucl', name: 'Continental Cup' },
  season: '2004-05',
  date: '2005-05-25',
  stage: 'Final',
  home: SAMPLE_MATCH.team,
  away: {
    id: 'sample-away',
    name: 'Real Solvara',
    shortName: 'Solvara',
    crestUrl: null,
  },
  score: { home: 3, away: 3 },
  nickname: null,
};

export const SAMPLE_YOU: DuelPlayer = {
  id: 'sample-you',
  handle: 'floodlit_fan',
  lives: 2,
};

export const SAMPLE_OPPONENT: DuelPlayer = {
  id: 'sample-opponent',
  handle: 'deadball_dan',
  lives: 3,
};

export const SAMPLE_FILTER_OPTIONS: FilterOptions = {
  competitions: [
    SAMPLE_IDENTITY.competition,
    { id: 'sample-league', kind: 'league', name: 'Premier Division' },
  ],
  clubs: [
    SAMPLE_MATCH.team,
    SAMPLE_IDENTITY.away,
    {
      id: 'sample-third',
      name: 'Athletic Varenna',
      shortName: 'Varenna',
      crestUrl: null,
    },
  ],
  era: { from: FIRST_SEASON_START, to: LAST_SEASON_START },
};

export const SAMPLE_FILTERS: Filters = {
  competitionIds: [SAMPLE_IDENTITY.competition.id],
  clubIds: [SAMPLE_MATCH.team.id],
  era: { from: 2003, to: 2008 },
};

// What a player who never narrows sends
export const SAMPLE_OPEN_FILTERS: Filters = {
  competitionIds: [],
  clubIds: [],
  era: { ...SAMPLE_FILTER_OPTIONS.era },
};

// Long names sit mid-pitch, where lines run widest
export const SAMPLE_NAMES = [
  'Gareth Pennock',
  'Dean Harlow',
  "Ciarán O'Donovan",
  'Stuart Fenwick',
  'Rhys Harlow',
  'Christophe Delacroix-Morel',
  'Íñigo Castañeda',
  'Jasper van der Linde',
  'Kofi Addo-Mensah',
  'Tavinho',
  'Wes Tolland',
];

export const GUESS_OUTCOME_OPTIONS: { value: GuessOutcome; label: string }[] = [
  { value: 'correct_new', label: 'Correct new' },
  { value: 'already_found', label: 'Already found' },
  { value: 'not_in_xi', label: 'Not in XI' },
];

export function samplePlayer(formation: string, slot: number): RevealedPlayer {
  return {
    id: `sample-${slot}`,
    name: SAMPLE_NAMES[slot],
    slot,
    position: slotLayout(formation)?.[slot]?.position ?? 'GK',
    imageUrl: null,
  };
}
