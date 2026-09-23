import { hasExpired, startRound } from '@/lib/api/mock/clock';
import { resolveGuess } from '@/lib/api/mock/matcher';
import type { MockSquad, MockSquadEntry } from '@/lib/api/mock/types';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import type { RoundTiming } from '@/types/game';
import type { RevealedPlayer } from '@/types/player';

export const STARTING_LIVES = 3;

export type EngineMode = 'solo' | 'duel';
export type EngineActor = 'you' | 'opponent';

export type EngineFound = {
  playerId: string;
  foundBy: EngineActor;
};

export type EngineState = {
  mode: EngineMode;
  squad: MockSquad;
  found: readonly EngineFound[];
  lives: Readonly<Record<EngineActor, number>>;
  turn: EngineActor;
  round: RoundTiming | null;
  status: 'active' | 'over';
};

export type EngineInput =
  { kind: 'guess'; actor: EngineActor; guess: string } | { kind: 'tick' };

export type EngineOutcome =
  | { kind: 'correct_new'; player: RevealedPlayer; foundBy: EngineActor }
  | { kind: 'already_found'; playerId: string }
  | { kind: 'not_in_xi' }
  | { kind: 'expired'; actor: EngineActor; livesRemaining: number }
  | { kind: 'ignored' };

export type EngineStep = {
  state: EngineState;
  outcome: EngineOutcome;
};

export function createEngineState(
  mode: EngineMode,
  squad: MockSquad,
  now: number,
): EngineState {
  return {
    mode,
    squad,
    found: [],
    lives: { you: STARTING_LIVES, opponent: STARTING_LIVES },
    turn: 'you',
    round: startRound(now),
    status: 'active',
  };
}

export function revealedPlayers(state: EngineState): RevealedPlayer[] {
  return state.found.map((found) => toRevealed(entryOf(state, found.playerId)));
}

export function remainingCount(state: EngineState): number {
  return SQUAD_SIZE - state.found.length;
}

function entryOf(state: EngineState, playerId: string): MockSquadEntry {
  const entry = state.squad.find((item) => item.playerId === playerId);
  if (!entry) throw new Error(`Unknown player in found pool: ${playerId}`);
  return entry;
}

function toRevealed(entry: MockSquadEntry): RevealedPlayer {
  return {
    id: entry.playerId,
    name: entry.name,
    slot: entry.slot,
    position: entry.position,
    imageUrl: null,
  };
}

function other(actor: EngineActor): EngineActor {
  return actor === 'you' ? 'opponent' : 'you';
}

function isComplete(found: readonly EngineFound[]): boolean {
  return found.length >= SQUAD_SIZE;
}

function handOver(state: EngineState, now: number): EngineState {
  // Solo has no opponent, so the same player starts the next round
  const turn = state.mode === 'duel' ? other(state.turn) : state.turn;
  return { ...state, turn, round: startRound(now) };
}

function applyGuess(
  state: EngineState,
  actor: EngineActor,
  guess: string,
  now: number,
): EngineStep {
  const resolution = resolveGuess(guess, state.squad);

  if (resolution.kind === 'miss' || resolution.kind === 'ambiguous') {
    return { state, outcome: { kind: 'not_in_xi' } };
  }

  const { entry } = resolution;
  const already = state.found.some((item) => item.playerId === entry.playerId);

  if (already) {
    return {
      state,
      outcome: { kind: 'already_found', playerId: entry.playerId },
    };
  }

  const found = [...state.found, { playerId: entry.playerId, foundBy: actor }];
  const outcome: EngineOutcome = {
    kind: 'correct_new',
    player: toRevealed(entry),
    foundBy: actor,
  };

  if (isComplete(found)) {
    return {
      state: { ...state, found, round: null, status: 'over' },
      outcome,
    };
  }

  return { state: handOver({ ...state, found }, now), outcome };
}

function applyExpiry(state: EngineState, now: number): EngineStep {
  const actor = state.turn;
  const livesRemaining = state.lives[actor] - 1;
  const lives = { ...state.lives, [actor]: livesRemaining };
  const outcome: EngineOutcome = { kind: 'expired', actor, livesRemaining };

  if (livesRemaining <= 0) {
    return {
      state: { ...state, lives, round: null, status: 'over' },
      outcome,
    };
  }

  return { state: handOver({ ...state, lives }, now), outcome };
}

export function resolveRound(
  state: EngineState,
  input: EngineInput,
  now: number,
): EngineStep {
  if (state.status === 'over' || state.round === null) {
    return { state, outcome: { kind: 'ignored' } };
  }

  if (hasExpired(state.round, now)) {
    return applyExpiry(state, now);
  }

  if (input.kind === 'tick') {
    return { state, outcome: { kind: 'ignored' } };
  }

  if (input.actor !== state.turn) {
    return { state, outcome: { kind: 'ignored' } };
  }

  return applyGuess(state, input.actor, input.guess, now);
}
