import { describe, expect, it } from 'vitest';
import { withoutPickedMatch } from '@/lib/archive';
import { withMode } from '@/lib/filters';
import {
  isStepFilled,
  isStepReachable,
  modeOptionFrom,
  playModeOf,
  playPath,
  playStepFrom,
  withModeOption,
  withStep,
} from '@/lib/play-steps';

describe('playModeOf', () => {
  it('reads solo and duel, and nothing else', () => {
    expect(playModeOf('solo')).toBe('solo');
    expect(playModeOf('duel')).toBe('duel');
    expect(playModeOf('DUEL')).toBeNull();
    expect(playModeOf(null)).toBeNull();
  });
});

describe('modeOptionFrom', () => {
  it('picks nothing without a mode', () => {
    expect(modeOptionFrom(new URLSearchParams('club=a'))).toBeNull();
  });

  it('reads the mode', () => {
    expect(modeOptionFrom(new URLSearchParams('mode=solo'))).toBe('solo');
    expect(modeOptionFrom(new URLSearchParams('mode=duel'))).toBe('duel');
  });

  it('reads practice, with or without solo', () => {
    expect(modeOptionFrom(new URLSearchParams('practice=1'))).toBe('practice');
    expect(modeOptionFrom(new URLSearchParams('mode=solo&practice=1'))).toBe(
      'practice',
    );
  });

  it('ignores practice on a duel', () => {
    expect(modeOptionFrom(new URLSearchParams('mode=duel&practice=1'))).toBe(
      'duel',
    );
  });
});

describe('withModeOption', () => {
  const base = new URLSearchParams('club=a&mode=duel&practice=1');

  it('writes each card explicitly', () => {
    expect(withModeOption(base, 'solo').toString()).toBe('club=a&mode=solo');
    expect(withModeOption(base, 'duel').toString()).toBe('club=a&mode=duel');
    expect(withModeOption(base, 'practice').toString()).toBe(
      'club=a&mode=solo&practice=1',
    );
  });

  it('clears the mode for no pick, leaving the input alone', () => {
    expect(withModeOption(base, null).toString()).toBe('club=a');
    expect(base.toString()).toBe('club=a&mode=duel&practice=1');
  });

  it('round-trips through modeOptionFrom', () => {
    for (const option of ['solo', 'duel', 'practice'] as const) {
      expect(modeOptionFrom(withModeOption(base, option))).toBe(option);
    }
  });
});

describe('playStepFrom', () => {
  it('reads the later steps once a mode is picked', () => {
    expect(playStepFrom(new URLSearchParams('mode=solo&step=filters'))).toBe(
      'filters',
    );
    expect(playStepFrom(new URLSearchParams('mode=duel&step=start'))).toBe(
      'start',
    );
  });

  it('falls back to the mode step without a mode', () => {
    expect(playStepFrom(new URLSearchParams('step=start'))).toBe('mode');
    expect(
      playStepFrom(new URLSearchParams('mode=solo&step=start'), false),
    ).toBe('mode');
  });

  it('reads a missing or odd step as the mode step', () => {
    expect(playStepFrom(new URLSearchParams('mode=solo'))).toBe('mode');
    expect(playStepFrom(new URLSearchParams('mode=solo&step=play'))).toBe(
      'mode',
    );
  });

  it('takes the caller’s mode over the URL’s', () => {
    expect(playStepFrom(new URLSearchParams('step=filters'), true)).toBe(
      'filters',
    );
  });
});

describe('withStep', () => {
  it('writes later steps and leaves the first out', () => {
    const params = new URLSearchParams('mode=solo&step=start');
    expect(withStep(params, 'filters').toString()).toBe(
      'mode=solo&step=filters',
    );
    expect(withStep(params, 'mode').toString()).toBe('mode=solo');
    expect(params.toString()).toBe('mode=solo&step=start');
  });
});

describe('step progress', () => {
  const none = { hasMode: false, hasFilters: true };
  const loading = { hasMode: true, hasFilters: false };
  const ready = { hasMode: true, hasFilters: true };

  it('fills the mode step with a pick, filters once loaded', () => {
    expect(isStepFilled('mode', none)).toBe(false);
    expect(isStepFilled('mode', loading)).toBe(true);
    expect(isStepFilled('filters', loading)).toBe(false);
    expect(isStepFilled('filters', ready)).toBe(true);
    expect(isStepFilled('start', ready)).toBe(false);
  });

  it('reaches a step once every earlier one is filled', () => {
    expect(isStepReachable('mode', none)).toBe(true);
    expect(isStepReachable('filters', none)).toBe(false);
    expect(isStepReachable('filters', loading)).toBe(true);
    expect(isStepReachable('start', loading)).toBe(false);
    expect(isStepReachable('start', ready)).toBe(true);
  });
});

describe('playPath', () => {
  it('links a step with what the params carry', () => {
    const params = new URLSearchParams('mode=solo&club=a&step=filters');
    expect(playPath(params, 'start')).toBe('/play?mode=solo&club=a&step=start');
    expect(playPath(params, 'mode')).toBe('/play?mode=solo&club=a');
  });

  it('adds a hash when asked', () => {
    const params = new URLSearchParams('mode=duel&room=K7QM2X');
    expect(playPath(params, 'mode', 'play-a-friend')).toBe(
      '/play?mode=duel&room=K7QM2X#play-a-friend',
    );
  });

  it('is bare /play with nothing to carry', () => {
    expect(playPath(new URLSearchParams(), 'mode')).toBe('/play');
  });
});

describe('leaving a game for /play', () => {
  it('takes a solo run back to Start with its choices', () => {
    const run = new URLSearchParams('competition=c&practice=1&match=m1');
    const href = playPath(withMode(withoutPickedMatch(run), 'solo'), 'start');
    expect(href).toBe('/play?competition=c&practice=1&mode=solo&step=start');
    const back = new URLSearchParams(href.split('?')[1]);
    expect(modeOptionFrom(back)).toBe('practice');
    expect(playStepFrom(back)).toBe('start');
  });

  it('takes a refused join back to step 1 at the join row', () => {
    const duel = new URLSearchParams('club=a&room=K7QM2X');
    const href = playPath(withMode(duel, 'duel'), 'mode', 'play-a-friend');
    expect(href).toBe('/play?club=a&room=K7QM2X&mode=duel#play-a-friend');
  });
});
