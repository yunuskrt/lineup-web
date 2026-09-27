import { slotLayout } from '@/lib/formation';
import type { DuelPlayer } from '@/types/duel';
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
