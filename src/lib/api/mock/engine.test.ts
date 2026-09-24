import { beforeEach, describe, expect, it } from 'vitest';
import {
  createEngineState,
  remainingCount,
  resolveRound,
  revealedPlayers,
  STARTING_LIVES,
  type EngineState,
} from '@/lib/api/mock/engine';
import { GRACE_WINDOW_MS, ROUND_DURATION_MS } from '@/lib/api/mock/clock';
import { requireFixture, squadFor } from '@/lib/api/mock/data/fixtures';

const T0 = 1_700_000_000_000;
const AFTER_EXPIRY = T0 + ROUND_DURATION_MS + GRACE_WINDOW_MS + 1;

// Northgate's XI, which holds the deliberate Harlow collision
const SQUAD = squadFor(requireFixture('match-crown-2003'), 'home');

function guess(state: EngineState, name: string, now = T0) {
  return resolveRound(
    state,
    { kind: 'guess', actor: state.turn, guess: name },
    now,
  );
}

function expire(state: EngineState, now = AFTER_EXPIRY) {
  return resolveRound(state, { kind: 'tick' }, now);
}

describe('engine — lives', () => {
  let state: EngineState;

  beforeEach(() => {
    state = createEngineState('solo', SQUAD, T0);
  });

  it('starts with exactly three lives', () => {
    expect(STARTING_LIVES).toBe(3);
    expect(state.lives.you).toBe(3);
  });

  it('loses a life only to the clock, never to a wrong answer', () => {
    const wrong = guess(state, 'Zinedine Zidane');
    expect(wrong.outcome.kind).toBe('not_in_xi');
    expect(wrong.state.lives.you).toBe(3);

    const repeated = guess(guess(state, 'Moss').state, 'Moss', T0 + 1);
    expect(repeated.outcome.kind).toBe('already_found');
    expect(repeated.state.lives.you).toBe(3);

    const expired = expire(state);
    expect(expired.outcome.kind).toBe('expired');
    expect(expired.state.lives.you).toBe(2);
  });

  it('ends the run when the third life is lost', () => {
    let current = state;
    for (let i = 0; i < 3; i += 1) {
      const step = expire(current, current.round!.endsAt + GRACE_WINDOW_MS + 1);
      current = step.state;
    }

    expect(current.lives.you).toBe(0);
    expect(current.status).toBe('over');
    expect(current.round).toBeNull();
  });
});

describe('engine — round resolution', () => {
  it('reveals a new player and resets the round', () => {
    const state = createEngineState('solo', SQUAD, T0);
    const step = guess(state, "Ciarán O'Donovan");

    expect(step.outcome.kind).toBe('correct_new');
    expect(step.state.found).toHaveLength(1);
    expect(step.state.round?.startedAt).toBe(T0);
    expect(remainingCount(step.state)).toBe(10);
  });

  it('leaves the round untouched for already-found and not-in-XI', () => {
    const first = guess(createEngineState('solo', SQUAD, T0), 'Tolland');
    const round = first.state.round;

    const again = guess(first.state, 'Tolland', T0 + 500);
    expect(again.outcome.kind).toBe('already_found');
    expect(again.state.round).toEqual(round);

    const missed = guess(first.state, 'Nobody At All', T0 + 600);
    expect(missed.outcome.kind).toBe('not_in_xi');
    expect(missed.state.round).toEqual(round);
  });

  it('treats an ambiguous in-XI surname as not in the XI', () => {
    const state = createEngineState('solo', SQUAD, T0);
    const step = guess(state, 'Harlow');

    expect(step.outcome.kind).toBe('not_in_xi');
    expect(step.state.found).toHaveLength(0);
  });

  it('ignores input once the session is over', () => {
    const state = createEngineState('solo', SQUAD, T0);
    const over = { ...state, status: 'over' as const, round: null };

    expect(guess(over, 'Tolland').outcome.kind).toBe('ignored');
  });
});

describe('engine — turn order', () => {
  it('passes the turn on a correct new answer in a duel', () => {
    const state = createEngineState('duel', SQUAD, T0);
    expect(state.turn).toBe('you');

    const step = guess(state, 'Moss');
    expect(step.outcome.kind).toBe('correct_new');
    expect(step.state.turn).toBe('opponent');
  });

  it('keeps the turn on the two no-penalty outcomes', () => {
    const state = createEngineState('duel', SQUAD, T0);
    const found = guess(state, 'Moss').state;

    expect(guess(found, 'Moss', T0 + 1).state.turn).toBe('opponent');
    expect(guess(found, 'Nobody', T0 + 2).state.turn).toBe('opponent');
  });

  it('does not hand over in solo — the same player continues', () => {
    const state = createEngineState('solo', SQUAD, T0);
    expect(guess(state, 'Moss').state.turn).toBe('you');
  });

  it('passes the turn when a life is lost', () => {
    const state = createEngineState('duel', SQUAD, T0);
    const step = expire(state);

    expect(step.state.turn).toBe('opponent');
    expect(step.state.lives.you).toBe(2);
    expect(step.state.lives.opponent).toBe(3);
  });

  it('ignores a guess from the player whose turn it is not', () => {
    const state = createEngineState('duel', SQUAD, T0);
    const step = resolveRound(
      state,
      { kind: 'guess', actor: 'opponent', guess: 'Moss' },
      T0,
    );

    expect(step.outcome.kind).toBe('ignored');
    expect(step.state.found).toHaveLength(0);
  });
});

describe('engine — terminal on eleven', () => {
  it('ends as soon as all eleven are named, with lives untouched', () => {
    let state = createEngineState('duel', SQUAD, T0);

    for (const entry of SQUAD) {
      const step = resolveRound(
        state,
        { kind: 'guess', actor: state.turn, guess: entry.name },
        T0,
      );
      state = step.state;
    }

    expect(state.found).toHaveLength(11);
    expect(state.status).toBe('over');
    expect(state.round).toBeNull();
    expect(state.lives.you).toBe(3);
    expect(state.lives.opponent).toBe(3);
    expect(remainingCount(state)).toBe(0);
  });

  it('reveals every named player and nobody else', () => {
    const state = createEngineState('solo', SQUAD, T0);
    const step = guess(state, 'Keele');

    expect(revealedPlayers(step.state)).toEqual([
      {
        id: 'pl-brandon-keele',
        name: 'Brandon Keele',
        slot: 10,
        position: 'FW',
        imageUrl: null,
      },
    ]);
  });
});

describe('engine — grace window', () => {
  it('does not expire inside the grace window', () => {
    const state = createEngineState('solo', SQUAD, T0);
    const withinGrace = T0 + ROUND_DURATION_MS + GRACE_WINDOW_MS;

    const step = resolveRound(
      state,
      { kind: 'guess', actor: 'you', guess: 'Tolland' },
      withinGrace,
    );

    expect(step.outcome.kind).toBe('correct_new');
    expect(step.state.lives.you).toBe(3);
  });
});
