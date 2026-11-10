import { overviewFrom } from '@/lib/api/mock/overview';
import type { CatalogOverview } from '@/types/catalog';
import type { ShowcasePlayback } from '@/types/landing';

export type LandingState = {
  description: string;
  overview: CatalogOverview | null;
  isLoading: boolean;
  playback?: ShowcasePlayback;
};

const READY = overviewFrom();

const LONG_NAMES = [
  'Campeonato Brasileiro Série A',
  'UEFA Champions League Qualifying',
  'Copa Libertadores de América',
];

// Five-digit counts and long names, for 320px
const LONG: CatalogOverview = {
  ...READY,
  counts: {
    matches: 24_815,
    players: 61_204,
    clubs: 10_482,
    nationalTeams: 211,
    seasons: 26,
  },
  highlights: {
    finals: 1_204,
    shootouts: 3_310,
    extraTime: 5_872,
    goals: 88_406,
  },
  competitions: [
    ...READY.competitions,
    ...LONG_NAMES.map((name, index) => ({
      id: `comp-long-${index}`,
      kind: 'league' as const,
      name,
      logoUrl: null,
    })),
  ],
};

export const LANDING_STATES: Record<string, LandingState> = {
  ready: {
    description:
      'The mock overview; the demo plays. Add &at=<ms> to freeze a moment.',
    overview: READY,
    isLoading: false,
  },
  'demo-paused': {
    description: 'The demo, paused before it starts: Play resumes it.',
    overview: READY,
    isLoading: false,
    playback: { startsPaused: true },
  },
  still: {
    description: 'The reduced-motion frame: eight slots filled, nothing moves.',
    overview: READY,
    isLoading: false,
    playback: { isStill: true },
  },
  loading: {
    description: 'The first fetch: every section as a skeleton.',
    overview: null,
    isLoading: true,
  },
  down: {
    description: 'The overview call failed: no archive, inside or showcase.',
    overview: null,
    isLoading: false,
  },
  'no-showcase': {
    description: 'The overview without a showcase: the fold column is empty.',
    overview: { ...READY, showcase: null },
    isLoading: false,
  },
  long: {
    description: 'Five-digit counts and long competition names.',
    overview: LONG,
    isLoading: false,
  },
};

export const DEFAULT_LANDING_STATE = 'ready';

export function resolveLandingState(
  name: string | string[] | undefined,
): LandingState {
  const key = typeof name === 'string' ? name : DEFAULT_LANDING_STATE;
  return LANDING_STATES[key] ?? LANDING_STATES[DEFAULT_LANDING_STATE];
}
