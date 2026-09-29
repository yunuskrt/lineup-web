import { AUTH_ERROR_MESSAGES } from '@/lib/auth';
import {
  SAMPLE_EMPTY_STATS,
  SAMPLE_GUEST,
  SAMPLE_STATS,
  SAMPLE_USER,
  sampleHistory,
} from '@/lib/dev/samples';
import type {
  HistoryMoreState,
  ProfileScreenView,
} from '@/types/profile-screen';

export const DEFAULT_PROFILE_STATE = 'populated';

// Built at render, so Today and Yesterday hold
export type ProfileState = {
  build: (now: number) => ProfileScreenView;
};

function populated(more: HistoryMoreState): ProfileState {
  return {
    build: (now) => ({
      status: 'ready',
      profile: { user: SAMPLE_USER, stats: SAMPLE_STATS },
      history: sampleHistory(now),
      more,
    }),
  };
}

export const PROFILE_STATES: Record<string, ProfileState> = {
  loading: { build: () => ({ status: 'loading', isGuest: false }) },
  'loading-guest': { build: () => ({ status: 'loading', isGuest: true }) },
  'signed-out': { build: () => ({ status: 'signedOut' }) },
  error: {
    build: () => ({ status: 'error', message: AUTH_ERROR_MESSAGES.network }),
  },
  empty: {
    build: () => ({
      status: 'ready',
      profile: { user: SAMPLE_USER, stats: SAMPLE_EMPTY_STATS },
      history: [],
      more: 'end',
    }),
  },
  guest: {
    build: (now) => ({
      status: 'ready',
      profile: { user: SAMPLE_GUEST, stats: SAMPLE_STATS },
      history: sampleHistory(now),
      more: 'idle',
    }),
  },
  populated: populated('idle'),
  'loading-more': populated('loading'),
  'more-failed': populated('failed'),
  end: populated('end'),
};

export function resolveProfileState(
  param: string | string[] | undefined,
): ProfileState {
  const name =
    typeof param === 'string' && Object.hasOwn(PROFILE_STATES, param)
      ? param
      : DEFAULT_PROFILE_STATE;

  return PROFILE_STATES[name];
}
