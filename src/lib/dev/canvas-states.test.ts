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
import { soloSummarySchema } from '@/lib/api/schemas/solo';
import {
  AFTER_GATE_STATE,
  CANVAS_STATES,
  DEFAULT_CANVAS_STATE,
  resolveCanvasState,
} from '@/lib/dev/canvas-states';
import type { CanvasMode, CanvasView } from '@/types/canvas';

const NOW = 1_700_000_000_000;

const MODES: CanvasMode[] = ['solo', 'duel'];

const SUMMARY_STATES = [
  'run-over',
  'run-over-pro',
  'perfect-clear',
  'quit',
] as const;

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

describe('solo summary snapshots', () => {
  function summaryOf(name: string) {
    const { view } = CANVAS_STATES.solo[name].build(NOW).frame;
    if (view.mode !== 'solo' || view.end?.status !== 'ready') {
      throw new Error(`${name} has no summary`);
    }
    return { view, summary: view.end.summary };
  }

  it('only carry summaries the backend could send', () => {
    for (const name of SUMMARY_STATES) {
      const { summary } = summaryOf(name);
      expect(soloSummarySchema.safeParse(summary).success, name).toBe(true);
    }
  });

  it('account for all eleven starters', () => {
    for (const name of SUMMARY_STATES) {
      const { summary } = summaryOf(name);
      expect(summary.found.length + summary.missedCount, name).toBe(SQUAD_SIZE);
    }
  });

  it('never list a found slot as missed', () => {
    for (const name of SUMMARY_STATES) {
      const { summary } = summaryOf(name);
      const foundSlots = new Set(summary.found.map((player) => player.slot));
      for (const player of summary.missed ?? []) {
        expect(foundSlots.has(player.slot), name).toBe(false);
      }
      if (summary.missed) {
        expect(summary.missed.length, name).toBe(summary.missedCount);
      }
    }
  });

  it('match the canvas to the summary', () => {
    for (const name of SUMMARY_STATES) {
      const { view, summary } = summaryOf(name);
      expect(view.found, name).toEqual(summary.found);
      expect(view.lives, name).toBe(summary.livesRemaining);
      expect(view.input, name).toBe('locked');
      expect(view.clock.round, name).toBeNull();
    }
  });

  it('send the missed list only to the Pro snapshot', () => {
    const withList = SUMMARY_STATES.filter(
      (name) => summaryOf(name).summary.missed !== null,
    );
    expect(withList).toEqual(['run-over-pro']);
  });

  it('end each run the way its name says', () => {
    expect(summaryOf('run-over').summary.endReason).toBe('lives_out');
    expect(summaryOf('perfect-clear').summary.endReason).toBe('perfect_clear');
    expect(summaryOf('quit').summary.endReason).toBe('quit');
  });

  it('load the summary with the run already over', () => {
    const { view } = CANVAS_STATES.solo['summary-loading'].build(NOW).frame;
    expect(view.mode === 'solo' && view.end).toEqual({ status: 'loading' });
    expect(view.input).toBe('locked');
  });

  it('leave every live state without a summary', () => {
    for (const [name, view] of viewsOf('solo')) {
      if (view.mode !== 'solo' || name.startsWith('summary')) continue;
      if ((SUMMARY_STATES as readonly string[]).includes(name)) continue;
      expect(view.end, name).toBeNull();
    }
  });
});
