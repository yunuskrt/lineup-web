import type { CompetitionKind } from '@/types/match';

// A club chip's mark when it has no crest
export const SHIELD_PATH =
  'M12 2.5 4.5 5.3v5.9c0 4.6 3.2 8.7 7.5 10.3 4.3-1.6 7.5-5.7 7.5-10.3V5.3L12 2.5Z';

const BALL_PATH =
  'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-4 3.8 2.8-1.5 4.4H9.7l-1.5-4.4L12 8Zm0 0V3m3.8 7.8 4.8-1.6m-6.3 6 2.9 4M9.7 15.2l-2.9 4m1.4-8.4-4.8-1.6';

const CUP_PATH =
  'M7.5 4h9v5a4.5 4.5 0 0 1-9 0V4Zm0 2H4.5v1a3 3 0 0 0 3 3m9-4h3v1a3 3 0 0 1-3 3M12 13.5V18m-4 2h8';

const GLOBE_PATH =
  'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9s-1.1 6.5-3.5 9c-2.4-2.5-3.5-5.5-3.5-9s1.1-6.5 3.5-9Z';

// Stroked marks; one per group in lib/filters
export const COMPETITION_KIND_PATH: Record<CompetitionKind, string> = {
  league: BALL_PATH,
  ucl: CUP_PATH,
  uel: CUP_PATH,
  world_cup: GLOBE_PATH,
  euro: GLOBE_PATH,
};
