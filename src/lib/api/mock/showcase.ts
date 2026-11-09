import type { Side } from '@/types/match';

// Mirrors R7: shown on the landing, never played
export const MOCK_SHOWCASE: {
  fixtureId: string;
  side: Side;
  reveals: readonly string[];
  miss: string;
} = {
  fixtureId: 'match-continental-2019-semi',
  side: 'home',
  reveals: [
    'pl-emeka-nwosu',
    'pl-oguzhan-simsek',
    'pl-jake-rowntree',
    'pl-luca-benedetti',
    'pl-sean-pritchard',
  ],
  // Started for the other side
  miss: 'pl-samuel-ekwueme',
};
