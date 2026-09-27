import { MAX_LIVES } from '@/lib/api/schemas/game';
import { ROUND_MS } from '@/lib/canvas';
import {
  SAMPLE_IDENTITY,
  SAMPLE_MATCH,
  SAMPLE_OPPONENT,
  SAMPLE_YOU,
  samplePlayer,
} from '@/lib/dev/samples';
import { FEEDBACK_MESSAGES } from '@/lib/feedback';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import type {
  CanvasGateView,
  CanvasMode,
  CanvasView,
  CanvasViewBase,
  DuelCanvasView,
  SoloCanvasView,
  SoloEndView,
} from '@/types/canvas';
import type { DuelActor } from '@/types/duel';
import type { Lives, RoundTiming } from '@/types/game';
import type { FoundPlayer, RevealedPlayer } from '@/types/player';
import type { SoloSummary } from '@/types/solo';

export const SNAPSHOT_EVENT_DELAY_MS = 600;

export const DEFAULT_CANVAS_STATE = 'loading';

// The state the gate's action moves on to
export const AFTER_GATE_STATE = 'idle';

export type CanvasFrame<V extends CanvasView = CanvasView> = {
  view: V;
  guess: string;
};

export type CanvasSnapshot<V extends CanvasView = CanvasView> = {
  frame: CanvasFrame<V>;
  next?: CanvasFrame<V>;
};

export type CanvasState<V extends CanvasView = CanvasView> = {
  description: string;
  build: (now: number) => CanvasSnapshot<V>;
};

type BaseFrame = { fields: CanvasViewBase; guess: string };

type BaseSnapshot = { frame: BaseFrame; next?: BaseFrame };

type SharedState = {
  description: string;
  build: (now: number, found: FoundPlayer[]) => BaseSnapshot;
};

const FORMATION = SAMPLE_MATCH.formation;

const REVEAL_SLOT = 2;
const THEIR_REVEAL_SLOT = 5;
const PULSED_SLOT = 0;

const SOLO_LIVES: Lives = 2;

const PENDING_GUESS = "Ciaran O'Donovan";
const ALREADY_FOUND_GUESS = 'Pennock';
const MISS_GUESS = 'Marco Bellandi';

const PRE_MATCH_GATE: CanvasGateView = {
  title: 'Match ready',
  detail: 'Name all eleven starters. Your clock starts when you press Start.',
  actionLabel: 'Start',
};

const SOLO_FOUND_SLOTS = [0, 4, 7, 10];
const QUIT_FOUND_SLOTS = [0, 2, 4, 7, 9, 10];
const ALL_SLOTS = Array.from({ length: SQUAD_SIZE }, (_, slot) => slot);

const SOLO_FOUND = playersAt(SOLO_FOUND_SLOTS);

const DUEL_FINDERS: [number, DuelActor][] = [
  [0, 'you'],
  [4, 'opponent'],
  [7, 'you'],
  [10, 'opponent'],
];

const DUEL_FOUND = DUEL_FINDERS.map(([slot, foundBy]) =>
  revealed(slot, foundBy),
);

function playersAt(slots: number[]): RevealedPlayer[] {
  return slots.map((slot) => samplePlayer(FORMATION, slot));
}

function playersBesides(slots: number[]): RevealedPlayer[] {
  return playersAt(ALL_SLOTS.filter((slot) => !slots.includes(slot)));
}

function revealed(slot: number, foundBy?: DuelActor): FoundPlayer {
  const player = samplePlayer(FORMATION, slot);
  return foundBy ? { ...player, foundBy } : player;
}

function roundLeaving(remaining: number, now: number): RoundTiming {
  return { startedAt: now - (ROUND_MS - remaining), endsAt: now + remaining };
}

function roundFrom(startedAt: number): RoundTiming {
  return { startedAt, endsAt: startedAt + ROUND_MS };
}

function fields(
  round: RoundTiming | null,
  found: FoundPlayer[],
  overrides: Partial<CanvasViewBase> = {},
): CanvasViewBase {
  return {
    match: SAMPLE_MATCH,
    found,
    clock: { round, isFrozen: false },
    input: 'live',
    toast: null,
    shakeKey: 0,
    lifeLostKey: 0,
    gate: null,
    ...overrides,
  };
}

function frame(base: CanvasViewBase, guess = ''): BaseFrame {
  return { fields: base, guess };
}

function toSolo(base: CanvasViewBase, lives = SOLO_LIVES): SoloCanvasView {
  return { ...base, mode: 'solo', lives, end: null };
}

function endedView(
  found: FoundPlayer[],
  lives: Lives,
  end: SoloEndView,
): SoloCanvasView {
  return { ...toSolo(fields(null, found, { input: 'locked' }), lives), end };
}

function summaryState(
  description: string,
  summary: SoloSummary,
): CanvasState<SoloCanvasView> {
  return {
    description,
    build: () => ({
      frame: {
        view: endedView(summary.found, summary.livesRemaining, {
          status: 'ready',
          summary,
        }),
        guess: '',
      },
    }),
  };
}

// Out of lives: 4 named rounds, 3 that ran out
const RUN_OVER_SUMMARY: SoloSummary = {
  match: SAMPLE_IDENTITY,
  found: SOLO_FOUND,
  missedCount: SQUAD_SIZE - SOLO_FOUND.length,
  missed: null,
  livesRemaining: 0,
  endReason: 'lives_out',
  accuracy: 0.4,
  bestStreak: 2,
  roundTimesMs: [3_200, 15_000, 6_100, 15_000, 2_400, 8_800, 15_000],
};

const PERFECT_CLEAR_SUMMARY: SoloSummary = {
  match: { ...SAMPLE_IDENTITY, nickname: 'The Long Night' },
  found: playersAt(ALL_SLOTS),
  missedCount: 0,
  missed: null,
  livesRemaining: 2,
  endReason: 'perfect_clear',
  accuracy: 0.85,
  bestStreak: 7,
  roundTimesMs: [
    2_100, 4_300, 3_800, 6_900, 15_000, 5_200, 2_700, 9_400, 3_300, 7_600,
    4_100, 11_200,
  ],
};

const QUIT_SUMMARY: SoloSummary = {
  match: SAMPLE_IDENTITY,
  found: playersAt(QUIT_FOUND_SLOTS),
  missedCount: SQUAD_SIZE - QUIT_FOUND_SLOTS.length,
  missed: null,
  livesRemaining: 2,
  endReason: 'quit',
  accuracy: 0.6,
  bestStreak: 3,
  roundTimesMs: [4_800, 3_100, 15_000, 7_200, 2_900, 5_600, 8_300, 5_200],
};

function toDuel(
  base: CanvasViewBase,
  players: Partial<Pick<DuelCanvasView, 'you' | 'opponent' | 'turn'>> = {},
): DuelCanvasView {
  return {
    ...base,
    mode: 'duel',
    you: SAMPLE_YOU,
    opponent: SAMPLE_OPPONENT,
    turn: 'you',
    ...players,
  };
}

function wrapSnapshot<V extends CanvasView>(
  snapshot: BaseSnapshot,
  wrap: (base: CanvasViewBase) => V,
): CanvasSnapshot<V> {
  const toFrame = ({ fields: base, guess }: BaseFrame) => ({
    view: wrap(base),
    guess,
  });

  return snapshot.next
    ? { frame: toFrame(snapshot.frame), next: toFrame(snapshot.next) }
    : { frame: toFrame(snapshot.frame) };
}

function staticState(
  description: string,
  remaining: number,
  overrides: Partial<CanvasViewBase> = {},
  guess = '',
): SharedState {
  return {
    description,
    build: (now, found) => ({
      frame: frame(
        fields(roundLeaving(remaining, now), found, overrides),
        guess,
      ),
    }),
  };
}

const SHARED = {
  idle: staticState('4 of 11 found, 12s left, input live.', 12_000),
  warning: staticState('7s left: the clock turns ember.', 7_000),
  critical: staticState('3s left: red and pulsing.', 3_000),
  pending: staticState(
    'Guess sent: input locked with a spinner, clock still running.',
    9_000,
    { input: 'pending' },
    PENDING_GUESS,
  ),
  alreadyFound: {
    description: 'A named player: their slot pulses, "Already named".',
    build: (now, found) => {
      const round = roundLeaving(10_000, now);
      return {
        frame: frame(fields(round, found), ALREADY_FOUND_GUESS),
        next: frame(
          fields(round, found, {
            toast: { id: 1, message: FEEDBACK_MESSAGES.alreadyFound },
            pulse: {
              playerId: samplePlayer(FORMATION, PULSED_SLOT).id,
              key: 1,
            },
          }),
        ),
      };
    },
  },
  notInXi: {
    description: 'A name outside the XI: the input shakes, "Not in this XI".',
    build: (now, found) => {
      const round = roundLeaving(10_000, now);
      return {
        frame: frame(fields(round, found), MISS_GUESS),
        next: frame(
          fields(round, found, {
            toast: { id: 1, message: FEEDBACK_MESSAGES.notInXi },
            shakeKey: 1,
          }),
          MISS_GUESS,
        ),
      };
    },
  },
} satisfies Record<string, SharedState>;

function solo(state: SharedState): CanvasState<SoloCanvasView> {
  return {
    description: state.description,
    build: (now) => wrapSnapshot(state.build(now, SOLO_FOUND), toSolo),
  };
}

function duel(state: SharedState): CanvasState<DuelCanvasView> {
  return {
    description: state.description,
    build: (now) =>
      wrapSnapshot(state.build(now, DUEL_FOUND), (base) => toDuel(base)),
  };
}

function loadingFields(): CanvasViewBase {
  return { ...fields(null, [], { input: 'locked' }), match: null };
}

export const SOLO_CANVAS_STATES: Record<string, CanvasState<SoloCanvasView>> = {
  loading: {
    description: 'Header and grid skeletons, stopped clock, input locked.',
    build: () => ({
      frame: { view: toSolo(loadingFields(), MAX_LIVES), guess: '' },
    }),
  },
  'pre-match': {
    description: 'The grid under the gate, waiting for Start.',
    build: () => ({
      frame: {
        view: toSolo(
          fields(null, [], { input: 'locked', gate: PRE_MATCH_GATE }),
          MAX_LIVES,
        ),
        guess: '',
      },
    }),
  },
  idle: solo(SHARED.idle),
  warning: solo(SHARED.warning),
  critical: solo(SHARED.critical),
  pending: solo(SHARED.pending),
  correct: {
    description: 'A new player: the slot reveals and a new round starts.',
    build: (now) => ({
      frame: {
        view: toSolo(
          fields(roundLeaving(9_000, now), SOLO_FOUND, { input: 'pending' }),
        ),
        guess: PENDING_GUESS,
      },
      next: {
        view: toSolo(
          fields(roundFrom(now + SNAPSHOT_EVENT_DELAY_MS), [
            ...SOLO_FOUND,
            revealed(REVEAL_SLOT),
          ]),
        ),
        guess: '',
      },
    }),
  },
  'already-found': solo(SHARED.alreadyFound),
  'not-in-xi': solo(SHARED.notInXi),
  'life-lost': {
    description: 'The clock runs out: a pip empties, flash, new round.',
    build: (now) => ({
      frame: {
        view: toSolo(
          fields(roundLeaving(SNAPSHOT_EVENT_DELAY_MS, now), SOLO_FOUND),
        ),
        guess: '',
      },
      next: {
        view: toSolo(
          fields(roundFrom(now + SNAPSHOT_EVENT_DELAY_MS), SOLO_FOUND, {
            lifeLostKey: 1,
          }),
          SOLO_LIVES - 1,
        ),
        guess: '',
      },
    }),
  },
  'summary-loading': {
    description: 'The run is over: the summary skeleton holds the rail.',
    build: () => ({
      frame: {
        view: endedView(SOLO_FOUND, 0, { status: 'loading' }),
        guess: '',
      },
    }),
  },
  'run-over': summaryState(
    'Out of lives with 4 named: stats, round times, 7 missed.',
    RUN_OVER_SUMMARY,
  ),
  'run-over-pro': summaryState(
    'As run-over, with the 7 missed names on the pitch (Pro).',
    { ...RUN_OVER_SUMMARY, missed: playersBesides(SOLO_FOUND_SLOTS) },
  ),
  'perfect-clear': summaryState(
    'All 11 named with 2 lives left: the turf takeover.',
    PERFECT_CLEAR_SUMMARY,
  ),
  quit: summaryState('Quit with 6 named: "Run ended", 5 missed.', QUIT_SUMMARY),
};

const THEIR_TURN = { turn: 'opponent' } as const;

export const DUEL_CANVAS_STATES: Record<string, CanvasState<DuelCanvasView>> = {
  loading: {
    description: 'Header and grid skeletons, both clocks stopped.',
    build: () => ({
      frame: {
        view: toDuel(loadingFields(), {
          you: { ...SAMPLE_YOU, lives: MAX_LIVES },
          opponent: { ...SAMPLE_OPPONENT, lives: MAX_LIVES },
        }),
        guess: '',
      },
    }),
  },
  idle: duel(SHARED.idle),
  warning: duel(SHARED.warning),
  critical: duel(SHARED.critical),
  pending: duel(SHARED.pending),
  correct: {
    description: 'A new player: the slot reveals and your clock freezes.',
    build: (now) => {
      const round = roundLeaving(9_000, now);
      return {
        frame: {
          view: toDuel(fields(round, DUEL_FOUND, { input: 'pending' })),
          guess: PENDING_GUESS,
        },
        next: {
          view: toDuel(
            fields(round, [...DUEL_FOUND, revealed(REVEAL_SLOT, 'you')], {
              clock: { round, isFrozen: true },
              input: 'locked',
            }),
          ),
          guess: '',
        },
      };
    },
  },
  'already-found': duel(SHARED.alreadyFound),
  'not-in-xi': duel(SHARED.notInXi),
  'life-lost': {
    description: 'Your clock runs out: a pip empties, flash, turn passes.',
    build: (now) => ({
      frame: {
        view: toDuel(
          fields(roundLeaving(SNAPSHOT_EVENT_DELAY_MS, now), DUEL_FOUND),
        ),
        guess: '',
      },
      next: {
        view: toDuel(
          fields(roundFrom(now + SNAPSHOT_EVENT_DELAY_MS), DUEL_FOUND, {
            lifeLostKey: 1,
            input: 'locked',
          }),
          {
            you: { ...SAMPLE_YOU, lives: SAMPLE_YOU.lives - 1 },
            ...THEIR_TURN,
          },
        ),
        guess: '',
      },
    }),
  },
  'their-turn': {
    description: 'Their clock runs in blue; you wait with no input.',
    build: (now) => ({
      frame: {
        view: toDuel(
          fields(roundLeaving(11_000, now), DUEL_FOUND, { input: 'locked' }),
          THEIR_TURN,
        ),
        guess: '',
      },
    }),
  },
  'their-reveal': {
    description: 'They name a player: the slot fills with a blue tint.',
    build: (now) => {
      const round = roundLeaving(9_000, now);
      return {
        frame: {
          view: toDuel(
            fields(round, DUEL_FOUND, { input: 'locked' }),
            THEIR_TURN,
          ),
          guess: '',
        },
        next: {
          view: toDuel(
            fields(
              round,
              [...DUEL_FOUND, revealed(THEIR_REVEAL_SLOT, 'opponent')],
              { clock: { round, isFrozen: true }, input: 'locked' },
            ),
            THEIR_TURN,
          ),
          guess: '',
        },
      };
    },
  },
  'their-life-lost': {
    description: 'Their clock runs out: their pip empties, no flash.',
    build: (now) => ({
      frame: {
        view: toDuel(
          fields(roundLeaving(SNAPSHOT_EVENT_DELAY_MS, now), DUEL_FOUND, {
            input: 'locked',
          }),
          THEIR_TURN,
        ),
        guess: '',
      },
      next: {
        view: toDuel(
          fields(roundFrom(now + SNAPSHOT_EVENT_DELAY_MS), DUEL_FOUND),
          {
            opponent: { ...SAMPLE_OPPONENT, lives: SAMPLE_OPPONENT.lives - 1 },
          },
        ),
        guess: '',
      },
    }),
  },
};

export const CANVAS_STATES: Record<CanvasMode, Record<string, CanvasState>> = {
  solo: SOLO_CANVAS_STATES,
  duel: DUEL_CANVAS_STATES,
};

export function resolveCanvasState(
  mode: CanvasMode,
  param: string | string[] | undefined,
): CanvasState {
  const states = CANVAS_STATES[mode];
  const name =
    typeof param === 'string' && Object.hasOwn(states, param)
      ? param
      : DEFAULT_CANVAS_STATE;

  return states[name];
}
