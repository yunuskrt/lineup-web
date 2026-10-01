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
    crestUrl: '/mock/crests/club-northgate.svg',
  },
  {
    id: 'club-riverton',
    name: 'Riverton Athletic',
    shortName: 'RIV',
    crestUrl: '/mock/crests/club-riverton.svg',
  },
  {
    id: 'club-kingsmere',
    name: 'Kingsmere City',
    shortName: 'KMC',
    crestUrl: '/mock/crests/club-kingsmere.svg',
  },
  {
    id: 'club-real-solvara',
    name: 'Real Solvara',
    shortName: 'RSO',
    crestUrl: '/mock/crests/club-real-solvara.svg',
  },
  {
    id: 'club-castellmar',
    name: 'Atlético Castellmar',
    shortName: 'ACA',
    crestUrl: '/mock/crests/club-castellmar.svg',
  },
  {
    id: 'club-yildirimspor',
    name: 'Yıldırımspor',
    shortName: 'YLD',
    crestUrl: '/mock/crests/club-yildirimspor.svg',
  },
  {
    id: 'club-weerdam',
    name: 'FC Weerdam',
    shortName: 'WEE',
    crestUrl: '/mock/crests/club-weerdam.svg',
  },
  {
    id: 'nat-valdoria',
    name: 'Valdoria',
    shortName: 'VAL',
    crestUrl: '/mock/crests/nat-valdoria.svg',
  },
  {
    id: 'nat-ostrenia',
    name: 'Ostrenia',
    shortName: 'OST',
    crestUrl: '/mock/crests/nat-ostrenia.svg',
  },
  {
    id: 'nat-kaltmark',
    name: 'Kaltmark',
    shortName: 'KAL',
    crestUrl: '/mock/crests/nat-kaltmark.svg',
  },
  {
    id: 'nat-serevia',
    name: 'Serevia',
    shortName: 'SRV',
    crestUrl: '/mock/crests/nat-serevia.svg',
  },
] satisfies ClubRef[];
