// Fictional competitions, clubs, nations; not real
import type { ClubRef, CompetitionRef } from '@/types/match';

export const COMPETITIONS = [
  { id: 'comp-crown-league', kind: 'league', name: 'Crown League' },
  { id: 'comp-liga-meridiana', kind: 'league', name: 'Liga Meridiana' },
  {
    id: 'comp-continental-cup',
    kind: 'ucl',
    name: 'Continental Champions Cup',
  },
  { id: 'comp-federation-trophy', kind: 'uel', name: 'Federation Trophy' },
  { id: 'comp-nations-cup', kind: 'world_cup', name: 'Global Nations Cup' },
  {
    id: 'comp-nations-championship',
    kind: 'euro',
    name: 'Continental Nations Championship',
  },
] satisfies CompetitionRef[];

export const CLUBS = [
  {
    id: 'club-northgate',
    name: 'Northgate United',
    shortName: 'NGU',
    crestUrl: null,
  },
  {
    id: 'club-riverton',
    name: 'Riverton Athletic',
    shortName: 'RIV',
    crestUrl: null,
  },
  {
    id: 'club-kingsmere',
    name: 'Kingsmere City',
    shortName: 'KMC',
    crestUrl: null,
  },
  {
    id: 'club-real-solvara',
    name: 'Real Solvara',
    shortName: 'RSO',
    crestUrl: null,
  },
  {
    id: 'club-castellmar',
    name: 'Atlético Castellmar',
    shortName: 'ACA',
    crestUrl: null,
  },
  {
    id: 'club-yildirimspor',
    name: 'Yıldırımspor',
    shortName: 'YLD',
    crestUrl: null,
  },
  { id: 'club-weerdam', name: 'FC Weerdam', shortName: 'WEE', crestUrl: null },
  { id: 'nat-valdoria', name: 'Valdoria', shortName: 'VAL', crestUrl: null },
  { id: 'nat-ostrenia', name: 'Ostrenia', shortName: 'OST', crestUrl: null },
  { id: 'nat-kaltmark', name: 'Kaltmark', shortName: 'KAL', crestUrl: null },
  { id: 'nat-serevia', name: 'Serevia', shortName: 'SRV', crestUrl: null },
] satisfies ClubRef[];
