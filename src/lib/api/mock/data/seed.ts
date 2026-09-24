// Placeholder data — invented clubs and players, not a real lineup.
// Real ingested fixtures arrive in W07 and replace this file wholesale.
import { mockSquadSchema } from '@/lib/api/mock/types';
import {
  clubRefSchema,
  competitionRefSchema,
  matchIdentitySchema,
} from '@/lib/api/schemas/match';

export const SEED_COMPETITION = competitionRefSchema.parse({
  id: 'comp-northern-league',
  kind: 'league',
  name: 'Northern League',
});

export const SEED_HOME_CLUB = clubRefSchema.parse({
  id: 'club-northgate',
  name: 'Northgate United',
  shortName: 'NGU',
  crestUrl: null,
});

export const SEED_AWAY_CLUB = clubRefSchema.parse({
  id: 'club-riverton',
  name: 'Riverton Athletic',
  shortName: 'RIV',
  crestUrl: null,
});

export const SEED_MATCH_IDENTITY = matchIdentitySchema.parse({
  id: 'match-0001',
  competition: SEED_COMPETITION,
  season: '2004-05',
  date: '2005-04-16',
  stage: 'Matchday 32',
  home: SEED_HOME_CLUB,
  away: SEED_AWAY_CLUB,
  score: { home: 3, away: 2 },
  nickname: 'The Placeholder Derby',
});

export const SEED_FORMATION = '4-4-2';

// Moreau appears twice on purpose: a bare surname must stay ambiguous
export const SEED_SQUAD = mockSquadSchema.parse([
  {
    playerId: 'pl-01',
    name: 'Emil Vasquez',
    slot: 0,
    position: 'GK',
    aliases: ['emil vasquez', 'vasquez', 'emil'],
  },
  {
    playerId: 'pl-02',
    name: 'Luís Moreau',
    slot: 1,
    position: 'DF',
    aliases: ['luis moreau', 'moreau', 'luis'],
  },
  {
    playerId: 'pl-03',
    name: 'Tomás Moreau',
    slot: 2,
    position: 'DF',
    aliases: ['tomas moreau', 'moreau', 'tomas'],
  },
  {
    playerId: 'pl-04',
    name: 'Kerem Şahin',
    slot: 3,
    position: 'DF',
    aliases: ['kerem sahin', 'sahin', 'kerem'],
  },
  {
    playerId: 'pl-05',
    name: 'Anders Bjørn',
    slot: 4,
    position: 'DF',
    aliases: ['anders bjorn', 'bjorn', 'anders'],
  },
  {
    playerId: 'pl-06',
    name: 'Jakub Černý',
    slot: 5,
    position: 'MF',
    aliases: ['jakub cerny', 'cerny', 'jakub'],
  },
  {
    playerId: 'pl-07',
    name: 'Ola Łucki',
    slot: 6,
    position: 'MF',
    aliases: ['ola lucki', 'lucki', 'ola'],
  },
  {
    playerId: 'pl-08',
    name: 'Diego Ferreira',
    slot: 7,
    position: 'MF',
    aliases: ['diego ferreira', 'ferreira', 'diego'],
  },
  {
    playerId: 'pl-09',
    name: 'Marcus Oyelaran',
    slot: 8,
    position: 'MF',
    aliases: ['marcus oyelaran', 'oyelaran', 'marcus'],
  },
  {
    playerId: 'pl-10',
    name: 'Nikolai Petrov',
    slot: 9,
    position: 'FW',
    aliases: ['nikolai petrov', 'petrov', 'nikolai'],
  },
  {
    playerId: 'pl-11',
    name: 'Rafael Duarte',
    slot: 10,
    position: 'FW',
    aliases: ['rafael duarte', 'duarte', 'rafa', 'rafael'],
  },
]);
