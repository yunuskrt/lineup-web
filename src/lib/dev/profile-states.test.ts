import { describe, expect, it } from 'vitest';
import { historyEntrySchema, profileSchema } from '@/lib/api/schemas/profile';
import {
  DEFAULT_PROFILE_STATE,
  PROFILE_STATES,
  resolveProfileState,
} from '@/lib/dev/profile-states';
import { playedAtLabel } from '@/lib/profile';
import type { ProfileScreenView } from '@/types/profile-screen';

const NOW = new Date(2026, 8, 29, 18).getTime();

const EXPECTED_STATES = [
  'loading',
  'loading-guest',
  'signed-out',
  'error',
  'empty',
  'guest',
  'populated',
  'loading-more',
  'more-failed',
  'end',
];

const ALL_OUTCOMES = [
  'solo:perfect_clear',
  'solo:lives_out',
  'solo:quit',
  'duel:win',
  'duel:loss',
  'duel:draw',
  'duel:forfeit_win',
];

type ReadyView = Extract<ProfileScreenView, { status: 'ready' }>;

function build(name: string): ProfileScreenView {
  return PROFILE_STATES[name].build(NOW);
}

function ready(name: string): ReadyView {
  const view = build(name);
  if (view.status !== 'ready') throw new Error(`${name} is not ready`);
  return view;
}

describe('PROFILE_STATES', () => {
  it('has every snapshot the spec lists', () => {
    expect(Object.keys(PROFILE_STATES)).toEqual(EXPECTED_STATES);
  });

  it.each(EXPECTED_STATES)('%s parses against the contract', (name) => {
    const view = build(name);
    if (view.status !== 'ready') return;

    expect(profileSchema.safeParse(view.profile).success).toBe(true);
    for (const entry of view.history) {
      expect(historyEntrySchema.safeParse(entry).success).toBe(true);
    }
  });

  it('covers every outcome in both modes when populated', () => {
    const seen = new Set(
      ready('populated').history.map(
        (entry) => `${entry.mode}:${entry.outcome}`,
      ),
    );
    expect([...seen].sort()).toEqual([...ALL_OUTCOMES].sort());
  });

  it('spreads history over today, yesterday, this year and last', () => {
    const now = new Date(NOW);
    const labels = ready('populated').history.map((entry) =>
      playedAtLabel(entry.playedAt, now),
    );

    expect(labels).toContain('Today');
    expect(labels).toContain('Yesterday');
    expect(labels.some((label) => /^\d+ [A-Z][a-z]{2}$/.test(label))).toBe(
      true,
    );
    expect(labels.some((label) => label.endsWith(' 2025'))).toBe(true);
  });

  it('keeps history newest first', () => {
    const times = ready('populated').history.map((entry) =>
      Date.parse(entry.playedAt),
    );
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('marks only the guest snapshots as guests', () => {
    const guests = EXPECTED_STATES.filter((name) => {
      const view = build(name);
      if (view.status === 'loading') return view.isGuest;
      return view.status === 'ready' && view.profile.user.isGuest;
    });
    expect(guests).toEqual(['loading-guest', 'guest']);
  });

  it('shows the empty page with no history and no duels', () => {
    const view = ready('empty');
    expect(view.history).toEqual([]);
    expect(view.profile.stats.played).toBe(0);
  });
});

describe('resolveProfileState', () => {
  it('resolves a known state', () => {
    expect(resolveProfileState('error')).toBe(PROFILE_STATES.error);
  });

  it.each([undefined, 'nope', ['error'], 'toString'])(
    'falls back to populated for %o',
    (param) => {
      expect(resolveProfileState(param)).toBe(
        PROFILE_STATES[DEFAULT_PROFILE_STATE],
      );
    },
  );
});
