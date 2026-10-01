import {
  FIRST_SEASON_START,
  LAST_SEASON_START,
} from '@/lib/api/schemas/common';
import { slotLayout } from '@/lib/formation';
import type { FilterOptions } from '@/types/catalog';
import type { DuelPlayer } from '@/types/duel';
import type { Filters } from '@/types/filters';
import type { DuelOutcome, GuessOutcome, SoloEndReason } from '@/types/game';
import type {
  ClubRef,
  CompetitionRef,
  MatchIdentity,
  MatchInPlay,
} from '@/types/match';
import type { RevealedPlayer } from '@/types/player';
import type { HistoryEntry, UserStats } from '@/types/profile';
import type { User } from '@/types/user';

export const SAMPLE_IDENTITY: MatchIdentity = {
  id: 'sample-match',
  competition: { id: 'sample-cup', kind: 'ucl', name: 'Continental Cup' },
  season: '2004-05',
  date: '2005-05-25',
  stage: 'Final',
  home: {
    id: 'sample-club',
    name: 'Northgate United',
    shortName: 'NGU',
    crestUrl: '/mock/crests/club-northgate.svg',
  },
  away: {
    id: 'sample-away',
    name: 'Real Solvara',
    shortName: 'RSO',
    crestUrl: '/mock/crests/club-real-solvara.svg',
  },
  score: { home: 3, away: 3 },
  nickname: null,
};

// Northgate's XI is the one being named
export const SAMPLE_MATCH: MatchInPlay = {
  ...SAMPLE_IDENTITY,
  side: 'home',
  formation: '4-4-2',
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
    SAMPLE_IDENTITY.home,
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
  clubIds: [SAMPLE_IDENTITY.home.id],
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

// One XI member without a photo shows the fallback
const NO_IMAGE_SLOT = 7;

function sampleHeadshot(slot: number): string {
  return `/mock/players/headshot-${(slot % 6) + 1}.svg`;
}

export function samplePlayer(formation: string, slot: number): RevealedPlayer {
  return {
    id: `sample-${slot}`,
    name: SAMPLE_NAMES[slot],
    slot,
    position: slotLayout(formation)?.[slot]?.position ?? 'GK',
    imageUrl: slot === NO_IMAGE_SLOT ? null : sampleHeadshot(slot),
  };
}

function club(id: string, name: string, shortName: string): ClubRef {
  return { id, name, shortName, crestUrl: null };
}

// Fictional, like the mock fixtures; codes are short names
const CLUBS = {
  ngu: club('club-northgate', 'Northgate United', 'NGU'),
  rso: club('club-real-solvara', 'Real Solvara', 'RSO'),
  kmc: club('club-kingsmere', 'Kingsmere City', 'KMC'),
  riv: club('club-riverton', 'Riverton Athletic', 'RIV'),
  yld: club('club-yildirimspor', 'Yıldırımspor', 'YLD'),
  aca: club('club-castellmar', 'Atlético Castellmar', 'ACA'),
  wee: club('club-weerdam', 'FC Weerdam', 'WEE'),
  val: club('nat-valdoria', 'Valdoria', 'VAL'),
  srv: club('nat-serevia', 'Serevia', 'SRV'),
  ost: club('nat-ostrenia', 'Ostrenia', 'OST'),
} as const;

const COMPETITIONS = {
  cup: {
    id: 'comp-continental-cup',
    kind: 'ucl',
    name: 'Continental Champions Cup',
  },
  crown: { id: 'comp-crown-league', kind: 'league', name: 'Crown League' },
  meridiana: {
    id: 'comp-liga-meridiana',
    kind: 'league',
    name: 'Liga Meridiana',
  },
  nations: {
    id: 'comp-nations-cup',
    kind: 'world_cup',
    name: 'Global Nations Cup',
  },
  championship: {
    id: 'comp-nations-championship',
    kind: 'euro',
    name: 'Continental Nations Championship',
  },
} as const satisfies Record<string, CompetitionRef>;

type HistoryMatchSeed = [
  id: string,
  competition: CompetitionRef,
  season: string,
  date: string,
  stage: string | null,
  home: ClubRef,
  away: ClubRef,
  score: [number, number],
  nickname: string | null,
];

const HISTORY_MATCH_SEEDS: HistoryMatchSeed[] = [
  [
    'h-1',
    COMPETITIONS.cup,
    '2004-05',
    '2005-05-03',
    'Semi-final',
    CLUBS.ngu,
    CLUBS.rso,
    [3, 2],
    'The Comeback at Northgate',
  ],
  [
    'h-2',
    COMPETITIONS.crown,
    '2011-12',
    '2012-05-13',
    'Matchday 38',
    CLUBS.kmc,
    CLUBS.riv,
    [1, 0],
    null,
  ],
  [
    'h-3',
    COMPETITIONS.meridiana,
    '2009-10',
    '2010-01-17',
    'Matchday 19',
    CLUBS.yld,
    CLUBS.aca,
    [2, 2],
    'The Mudbath Derby',
  ],
  [
    'h-4',
    COMPETITIONS.cup,
    '2014-15',
    '2014-10-22',
    'Group stage',
    CLUBS.wee,
    CLUBS.ngu,
    [0, 1],
    null,
  ],
  [
    'h-5',
    COMPETITIONS.nations,
    '2006',
    '2006-07-05',
    'Semi-final',
    CLUBS.val,
    CLUBS.srv,
    [4, 3],
    'The Night of the Six',
  ],
  [
    'h-6',
    COMPETITIONS.championship,
    '2012',
    '2012-07-01',
    'Final',
    CLUBS.ost,
    CLUBS.val,
    [1, 1],
    'The Rain Final',
  ],
  [
    'h-7',
    COMPETITIONS.cup,
    '2018-19',
    '2019-05-25',
    'Final',
    CLUBS.rso,
    CLUBS.ngu,
    [2, 0],
    null,
  ],
  [
    'h-8',
    COMPETITIONS.crown,
    '2023-24',
    '2024-05-19',
    'Matchday 38',
    CLUBS.riv,
    CLUBS.kmc,
    [1, 3],
    'The Final-Day Swing',
  ],
];

export const SAMPLE_HISTORY_MATCHES: MatchIdentity[] = HISTORY_MATCH_SEEDS.map(
  ([id, competition, season, date, stage, home, away, score, nickname]) => ({
    id,
    competition,
    season,
    date,
    stage,
    home,
    away,
    score: { home: score[0], away: score[1] },
    nickname,
  }),
);

export const SAMPLE_USER: User = {
  id: SAMPLE_YOU.id,
  handle: SAMPLE_YOU.handle,
  isGuest: false,
  tier: 'free',
};

export const SAMPLE_GUEST: User = { ...SAMPLE_USER, isGuest: true };

// The prototype's numbers: 22 duels, 12 solo runs
export const SAMPLE_STATS: UserStats = {
  played: 34,
  wins: 14,
  draws: 2,
  losses: 6,
  accuracy: 0.64,
  bestStreak: 7,
  perfectClears: 1,
  favouriteClub: CLUBS.ngu,
};

export const SAMPLE_EMPTY_STATS: UserStats = {
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  accuracy: 0,
  bestStreak: 0,
  perfectClears: 0,
  favouriteClub: null,
};

type HistoryResult =
  | { mode: 'solo'; outcome: SoloEndReason }
  | { mode: 'duel'; outcome: DuelOutcome };

type HistorySeed = HistoryResult & {
  found: number;
  lives: number;
  // How long ago, so Today and Yesterday stay true
  minutesAgo: number;
};

const MINUTES_PER_DAY = 24 * 60;

function days(count: number): number {
  return count * MINUTES_PER_DAY;
}

const HISTORY_SEEDS: HistorySeed[] = [
  { mode: 'duel', outcome: 'win', found: 6, lives: 2, minutesAgo: 5 },
  {
    mode: 'solo',
    outcome: 'perfect_clear',
    found: 11,
    lives: 1,
    minutesAgo: 40,
  },
  { mode: 'duel', outcome: 'loss', found: 4, lives: 0, minutesAgo: days(1) },
  {
    mode: 'duel',
    outcome: 'forfeit_win',
    found: 3,
    lives: 3,
    minutesAgo: days(1) + 30,
  },
  {
    mode: 'solo',
    outcome: 'lives_out',
    found: 7,
    lives: 0,
    minutesAgo: days(17),
  },
  { mode: 'duel', outcome: 'draw', found: 11, lives: 1, minutesAgo: days(21) },
  { mode: 'solo', outcome: 'quit', found: 5, lives: 2, minutesAgo: days(30) },
  { mode: 'duel', outcome: 'win', found: 8, lives: 1, minutesAgo: days(34) },
  { mode: 'duel', outcome: 'win', found: 5, lives: 3, minutesAgo: days(41) },
  {
    mode: 'solo',
    outcome: 'lives_out',
    found: 9,
    lives: 0,
    minutesAgo: days(45),
  },
  { mode: 'duel', outcome: 'loss', found: 2, lives: 0, minutesAgo: days(52) },
  { mode: 'duel', outcome: 'win', found: 7, lives: 2, minutesAgo: days(60) },
  {
    mode: 'solo',
    outcome: 'lives_out',
    found: 6,
    lives: 0,
    minutesAgo: days(66),
  },
  { mode: 'duel', outcome: 'draw', found: 11, lives: 2, minutesAgo: days(73) },
  {
    mode: 'duel',
    outcome: 'forfeit_win',
    found: 1,
    lives: 3,
    minutesAgo: days(80),
  },
  { mode: 'solo', outcome: 'quit', found: 3, lives: 3, minutesAgo: days(88) },
  { mode: 'duel', outcome: 'win', found: 6, lives: 1, minutesAgo: days(97) },
  { mode: 'duel', outcome: 'loss', found: 5, lives: 0, minutesAgo: days(380) },
  {
    mode: 'solo',
    outcome: 'lives_out',
    found: 8,
    lives: 0,
    minutesAgo: days(392),
  },
  { mode: 'duel', outcome: 'win', found: 4, lives: 2, minutesAgo: days(410) },
];

function resultOf(seed: HistorySeed): HistoryResult {
  return seed.mode === 'solo'
    ? { mode: 'solo', outcome: seed.outcome }
    : { mode: 'duel', outcome: seed.outcome };
}

// Newest first, like the history endpoint
export function sampleHistory(now: number): HistoryEntry[] {
  return HISTORY_SEEDS.map((seed, index) => ({
    ...resultOf(seed),
    id: `history-${index + 1}`,
    playedAt: new Date(now - seed.minutesAgo * 60_000).toISOString(),
    match: SAMPLE_HISTORY_MATCHES[index % SAMPLE_HISTORY_MATCHES.length],
    foundCount: seed.found,
    livesRemaining: seed.lives,
  }));
}
