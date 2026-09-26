import { describe, expect, it } from 'vitest';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import {
  duelFoundPlayerSchema,
  duelPlayerSchema,
} from '@/lib/api/schemas/duel';
import {
  livesSchema,
  MAX_LIVES,
  roundTimingSchema,
} from '@/lib/api/schemas/game';
import { maskedMatchSchema } from '@/lib/api/schemas/match';
import { revealedPlayerSchema } from '@/lib/api/schemas/player';
import {
  AFTER_GATE_STATE,
  CANVAS_STATES,
  DEFAULT_CANVAS_STATE,
  resolveCanvasState,
} from '@/lib/dev/canvas-states';
import type { CanvasMode, CanvasView } from '@/types/canvas';

const NOW = 1_700_000_000_000;

const MODES: CanvasMode[] = ['solo', 'duel'];

// What each `next` swap is there to demonstrate
const EXPECTED_CHANGES: Record<CanvasMode, Record<string, string[]>> = {
  solo: {
    correct: ['clock', 'found', 'input'],
    'already-found': ['pulse', 'toast'],
    'not-in-xi': ['shakeKey', 'toast'],
    'life-lost': ['clock', 'lifeLostKey', 'lives'],
  },
  duel: {
    correct: ['clock', 'found', 'input'],
    'already-found': ['pulse', 'toast'],
    'not-in-xi': ['shakeKey', 'toast'],
    'life-lost': ['clock', 'input', 'lifeLostKey', 'turn', 'you'],
    'their-reveal': ['clock', 'found'],
    'their-life-lost': ['clock', 'input', 'opponent', 'turn'],
  },
};

function viewsOf(mode: CanvasMode): [string, CanvasView][] {
  return Object.entries(CANVAS_STATES[mode]).flatMap(([name, state]) => {
    const { frame, next } = state.build(NOW);
    return next
      ? [
          [name, frame.view],
          [name, next.view],
        ]
      : [[name, frame.view]];
  });
}

function livesOf(view: CanvasView): number[] {
  return view.mode === 'solo'
    ? [view.lives]
    : [view.you.lives, view.opponent.lives];
}

function changedKeys(before: CanvasView, after: CanvasView): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys]
    .filter(
      (key) =>
        JSON.stringify(before[key as keyof CanvasView]) !==
        JSON.stringify(after[key as keyof CanvasView]),
    )
    .sort();
}

describe('resolveCanvasState', () => {
  it.each(MODES)('resolves every %s state by name', (mode) => {
    for (const [name, state] of Object.entries(CANVAS_STATES[mode])) {
      expect(resolveCanvasState(mode, name)).toBe(state);
    }
  });

  it.each(MODES)('falls back to loading in %s', (mode) => {
    const fallback = CANVAS_STATES[mode][DEFAULT_CANVAS_STATE];
    expect(resolveCanvasState(mode, undefined)).toBe(fallback);
    expect(resolveCanvasState(mode, 'nope')).toBe(fallback);
    expect(resolveCanvasState(mode, 'toString')).toBe(fallback);
    expect(resolveCanvasState(mode, ['idle', 'warning'])).toBe(fallback);
  });

  it('keeps duel-only states out of solo', () => {
    expect(resolveCanvasState('solo', 'their-turn')).toBe(
      CANVAS_STATES.solo[DEFAULT_CANVAS_STATE],
    );
  });
});

describe.each(MODES)('%s snapshots', (mode) => {
  it('build views of their own mode', () => {
    for (const [, view] of viewsOf(mode)) expect(view.mode).toBe(mode);
  });

  it('keep the found pool within one XI, one player per slot', () => {
    for (const [name, view] of viewsOf(mode)) {
      const slots = view.found.map((player) => player.slot);
      expect(view.found.length, name).toBeLessThanOrEqual(SQUAD_SIZE);
      expect(new Set(slots).size, name).toBe(slots.length);
    }
  });

  it('keep lives between 0 and the maximum', () => {
    for (const [name, view] of viewsOf(mode)) {
      for (const lives of livesOf(view)) {
        expect(lives, name).toBeGreaterThanOrEqual(0);
        expect(lives, name).toBeLessThanOrEqual(MAX_LIVES);
      }
    }
  });

  it('end every round after it starts', () => {
    for (const [name, view] of viewsOf(mode)) {
      const { round } = view.clock;
      if (round) expect(round.endsAt, name).toBeGreaterThan(round.startedAt);
    }
  });

  it('load with no match and no round', () => {
    const { frame, next } = CANVAS_STATES[mode].loading.build(NOW);
    expect(frame.view.match).toBeNull();
    expect(frame.view.clock.round).toBeNull();
    expect(frame.view.input).toBe('locked');
    expect(next).toBeUndefined();
  });

  it('swap only the fields each state demonstrates', () => {
    const withNext = Object.entries(CANVAS_STATES[mode]).filter(
      ([, state]) => state.build(NOW).next,
    );
    expect(withNext.map(([name]) => name).sort()).toEqual(
      Object.keys(EXPECTED_CHANGES[mode]).sort(),
    );

    for (const [name, state] of withNext) {
      const { frame, next } = state.build(NOW);
      if (!next) continue;
      expect(changedKeys(frame.view, next.view), name).toEqual(
        EXPECTED_CHANGES[mode][name],
      );
    }
  });
});

describe.each(MODES)('%s snapshots against the contract', (mode) => {
  it('only carry shapes the backend could send', () => {
    for (const [name, view] of viewsOf(mode)) {
      if (view.match) {
        expect(maskedMatchSchema.safeParse(view.match).success, name).toBe(
          true,
        );
      }
      if (view.clock.round) {
        expect(
          roundTimingSchema.safeParse(view.clock.round).success,
          name,
        ).toBe(true);
      }
      if (view.mode === 'solo') {
        expect(livesSchema.safeParse(view.lives).success, name).toBe(true);
        for (const player of view.found) {
          expect(
            revealedPlayerSchema.strict().safeParse(player).success,
            name,
          ).toBe(true);
        }
      } else {
        for (const player of [view.you, view.opponent]) {
          expect(duelPlayerSchema.safeParse(player).success, name).toBe(true);
        }
        for (const player of view.found) {
          expect(duelFoundPlayerSchema.safeParse(player).success, name).toBe(
            true,
          );
        }
      }
    }
  });
});

describe('the gate action', () => {
  it.each(MODES)('moves %s to a live, ungated state', (mode) => {
    const state = CANVAS_STATES[mode][AFTER_GATE_STATE];
    expect(state).toBeDefined();

    const { frame } = state.build(NOW);
    expect(frame.view.gate).toBeNull();
    expect(frame.view.input).toBe('live');
    expect(frame.view.clock.round).not.toBeNull();
  });
});

describe('duel snapshots', () => {
  it('only flash the screen for your own lost life', () => {
    for (const [name, state] of Object.entries(CANVAS_STATES.duel)) {
      const { frame, next } = state.build(NOW);
      if (!next || next.view.mode !== 'duel' || frame.view.mode !== 'duel') {
        continue;
      }
      const flashed = next.view.lifeLostKey !== frame.view.lifeLostKey;
      const youLost = next.view.you.lives < frame.view.you.lives;
      expect(flashed, name).toBe(youLost);
    }
  });
});
