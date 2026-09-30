import { describe, expect, it } from 'vitest';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import {
  connectionStateSchema,
  duelFoundPlayerSchema,
  duelPlayerSchema,
  duelResultSchema,
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
  EMPTY_POOL_REASONS,
  LOBBY_STATES,
  RESULT_STATES,
  resolveCanvasState,
} from '@/lib/dev/canvas-states';
import { SAMPLE_OPPONENT } from '@/lib/dev/samples';
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
    : [view.you, view.opponent].flatMap((player) =>
        player ? [player.lives] : [],
      );
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
          if (!player) continue;
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

describe('duel lobby snapshots', () => {
  const LOBBY_NAMES = Object.keys(LOBBY_STATES);

  function lobbyViewOf(name: string) {
    const { view } = CANVAS_STATES.duel[name].build(NOW).frame;
    if (view.mode !== 'duel') throw new Error(`${name} is not a duel`);
    return view;
  }

  it('cover every lobby step', () => {
    const steps = new Set(
      LOBBY_NAMES.map((name) => lobbyViewOf(name).lobby?.step),
    );
    expect([...steps].sort()).toEqual([
      'coinFlip',
      'filters',
      'noOpponent',
      'paired',
      'searching',
    ]);
  });

  it('gate the loading canvas with no turn and no clock', () => {
    for (const name of LOBBY_NAMES) {
      const view = lobbyViewOf(name);
      expect(view.lobby, name).not.toBeNull();
      expect(view.gate, name).not.toBeNull();
      expect(view.match, name).toBeNull();
      expect(view.clock.round, name).toBeNull();
      expect(view.turn, name).toBeNull();
      expect(view.input, name).toBe('locked');
    }
  });

  it('leave the opponent unknown only before pairing', () => {
    const unpaired = LOBBY_NAMES.filter(
      (name) => lobbyViewOf(name).opponent === null,
    );
    expect(unpaired.sort()).toEqual(['no-opponent', 'searching']);
  });

  it('name each winner of the coin flip', () => {
    const won = lobbyViewOf('coin-flip-won');
    const lost = lobbyViewOf('coin-flip-lost');
    expect(won.lobby?.step === 'coinFlip' && won.lobby.winner).toBe('you');
    expect(lost.lobby?.step === 'coinFlip' && lost.lobby.winner).toBe(
      'opponent',
    );
    expect(won.gate?.title).toBe('Your filters won');
    expect(lost.gate?.title).toContain(SAMPLE_OPPONENT.handle);
  });

  it('show the set the flip applied, whole', () => {
    const won = lobbyViewOf('coin-flip-won').lobby;
    const lost = lobbyViewOf('coin-flip-lost').lobby;
    const filters = lobbyViewOf('filters').lobby;
    if (
      won?.step !== 'coinFlip' ||
      lost?.step !== 'coinFlip' ||
      filters?.step !== 'filters'
    ) {
      throw new Error('missing lobby steps');
    }
    expect(won.applied).toEqual(filters.yours);
    // Their set replaces yours; nothing is merged
    for (const [index, line] of lost.applied.entries()) {
      expect(line.label).toBe(filters.yours[index].label);
      expect(line.value).not.toBe(filters.yours[index].value);
    }
  });

  it('lock filters in the order the names say', () => {
    const submissionOf = (name: string) => {
      const lobby = lobbyViewOf(name).lobby;
      return lobby?.step === 'filters' ? lobby.submission : null;
    };
    expect(submissionOf('filters')).toEqual({
      yours: 'pending',
      theirs: 'pending',
    });
    expect(submissionOf('filters-locked')).toEqual({
      yours: 'submitted',
      theirs: 'pending',
    });
    expect(submissionOf('filters-both')).toEqual({
      yours: 'submitted',
      theirs: 'submitted',
    });
  });

  it('leave every live-play state without a lobby', () => {
    for (const [name, view] of viewsOf('duel')) {
      if (LOBBY_NAMES.includes(name) || view.mode !== 'duel') continue;
      expect(view.lobby, name).toBeNull();
      expect(view.opponent, name).not.toBeNull();
    }
  });
});

describe('duel result snapshots', () => {
  const RESULT_NAMES = Object.keys(RESULT_STATES);

  function resultViewOf(name: string) {
    const { view } = CANVAS_STATES.duel[name].build(NOW).frame;
    if (view.mode !== 'duel' || !view.end) {
      throw new Error(`${name} has no result`);
    }
    return { view, result: view.end };
  }

  it('only carry results the backend could send', () => {
    for (const name of RESULT_NAMES) {
      const { result } = resultViewOf(name);
      expect(duelResultSchema.safeParse(result).success, name).toBe(true);
    }
  });

  it('cover every outcome, and both forfeits', () => {
    const outcomes = RESULT_NAMES.map((name) => {
      const { result } = resultViewOf(name);
      return `${result.outcome}${result.isForfeit ? '+forfeit' : ''}`;
    });
    expect(outcomes.sort()).toEqual([
      'draw',
      'forfeit_win+forfeit',
      'loss',
      'loss+forfeit',
      'win',
    ]);
  });

  it('name all eleven in the draw, split between both', () => {
    const { result } = resultViewOf('result-draw');
    const finders = new Set(result.found.map((player) => player.foundBy));
    expect(result.found).toHaveLength(SQUAD_SIZE);
    expect(finders).toEqual(new Set(['you', 'opponent']));
  });

  it('end the side that ran out on zero lives', () => {
    expect(resultViewOf('result-win').result.opponent.lives).toBe(0);
    expect(resultViewOf('result-loss').result.you.lives).toBe(0);
  });

  it('match the canvas to the result', () => {
    for (const name of RESULT_NAMES) {
      const { view, result } = resultViewOf(name);
      expect(view.found, name).toEqual(result.found);
      expect(view.you, name).toEqual(result.you);
      expect(view.opponent, name).toEqual(result.opponent);
      expect(view.turn, name).toBeNull();
      expect(view.clock.round, name).toBeNull();
      expect(view.input, name).toBe('locked');
      expect(view.gate, name).toBeNull();
    }
  });

  it('leave every live duel state without a result', () => {
    for (const [name, view] of viewsOf('duel')) {
      if (RESULT_NAMES.includes(name) || view.mode !== 'duel') continue;
      expect(view.end, name).toBeNull();
    }
  });

  it('report the reconnecting opponent with a future deadline', () => {
    const { view } =
      CANVAS_STATES.duel['opponent-reconnecting'].build(NOW).frame;
    if (view.mode !== 'duel') throw new Error('not a duel');
    expect(
      connectionStateSchema.safeParse(view.opponentConnection).success,
    ).toBe(true);
    expect(view.opponentConnection?.reconnectDeadline).toBeGreaterThan(NOW);
    expect(view.turn).toBe('opponent');
    expect(view.clock.round).not.toBeNull();
  });
});

describe('system state snapshots', () => {
  const EMPTY_POOL_TITLES = {
    competition: /competitions/,
    club: /clubs/,
    era: /seasons/,
    combination: /together/,
  } as const;

  function soloView(name: string) {
    return CANVAS_STATES.solo[name].build(NOW).frame.view;
  }

  it.each(EMPTY_POOL_REASONS)(
    'names the %s filter over the loading canvas',
    (reason) => {
      const view = soloView(`empty-pool-${reason}`);
      expect(view.gate?.title).toMatch(EMPTY_POOL_TITLES[reason]);
      expect(view.match).toBeNull();
      expect(view.input).toBe('locked');
    },
  );

  it('offers a widen everywhere but on a combination', () => {
    for (const reason of EMPTY_POOL_REASONS) {
      const { gate } = soloView(`empty-pool-${reason}`);
      const canWiden = reason !== 'combination';
      expect(gate?.actionLabel?.startsWith('Include'), reason).toBe(canWiden);
      expect(gate?.secondaryActionLabel === 'Change filters', reason).toBe(
        canWiden,
      );
    }
  });

  it('gates the duel lock with a widen', () => {
    const { gate, lobby } = CANVAS_STATES.duel['duel-empty-pool'].build(NOW)
      .frame.view as Extract<CanvasView, { mode: 'duel' }>;
    expect(gate?.actionLabel).toBe('Include every club');
    expect(lobby).toBeNull();
  });

  it.each([
    ['solo', 'rate-limited'],
    ['duel', 'duel-rate-limited'],
  ] as const)('locks %s input with the clock still running', (mode, name) => {
    const { frame } = CANVAS_STATES[mode][name].build(NOW);
    expect(frame.view.input).toBe('cooldown');
    expect(frame.view.cooldownUntil).toBeGreaterThan(NOW);
    expect(frame.view.clock.isFrozen).toBe(false);
    expect(frame.view.clock.round?.endsAt).toBeGreaterThan(NOW);
    expect(frame.view.toast).toBeNull();
    expect(frame.guess).not.toBe('');
  });

  it('only sets a cooldown time on cooldown input', () => {
    for (const mode of MODES) {
      for (const [name, view] of viewsOf(mode)) {
        expect(view.cooldownUntil !== undefined, name).toBe(
          view.input === 'cooldown',
        );
      }
    }
  });
});
