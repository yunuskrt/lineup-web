import type { DuelClient } from '@/lib/api/duel-client';
import { GRACE_WINDOW_MS } from '@/lib/api/mock/clock';
import { SEED_MATCH_IDENTITY, SEED_SQUAD } from '@/lib/api/mock/data/seed';
import { createEmitter } from '@/lib/api/mock/emitter';
import {
  createEngineState,
  foundWithActor,
  resolveRound,
  type EngineActor,
  type EngineState,
} from '@/lib/api/mock/engine';
import type { DuelScenario } from '@/lib/api/mock/scenarios';
import type { MockClock } from '@/lib/api/mock/store';
import {
  ACK,
  fail,
  isGuessable,
  maskedMatchFor,
  toGuessResult,
} from '@/lib/api/mock/shared';
import { duelGuessRequestSchema } from '@/lib/api/schemas/duel';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import type { ApiError } from '@/types/api';
import type {
  DuelFoundPlayer,
  DuelPlayer,
  DuelResult,
  DuelSession,
  FilterSubmissionStatus,
} from '@/types/duel';
import type { Filters } from '@/types/filters';

export const QUEUE_WAIT_MS = 2_000;
export const OPPONENT_FILTER_MS = 1_200;
export const RECONNECT_WINDOW_MS = 20_000;

const DEFAULT_THINK_TIME_MS = 6_000;
const DEFAULT_HIT_RATE = 0.65;

export type MockDuelOptions = {
  now?: MockClock;
  random?: () => number;
  scenario?: DuelScenario;
  handle?: string;
  opponentHandle?: string;
  thinkTimeMs?: number;
  hitRate?: number;
};

type Phase = 'idle' | 'queued' | 'filters' | 'playing' | 'finished';

export function createMockDuelClient(
  options: MockDuelOptions = {},
): DuelClient {
  const now = options.now ?? (() => Date.now());
  const random = options.random ?? Math.random;
  const scenario = options.scenario;
  const thinkTimeMs = options.thinkTimeMs ?? DEFAULT_THINK_TIME_MS;
  const hitRate = options.hitRate ?? DEFAULT_HIT_RATE;

  const emitter = createEmitter();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  let phase: Phase = 'idle';
  let engine: EngineState | null = null;
  let you: DuelPlayer = {
    id: 'you',
    handle: options.handle ?? 'You',
    lives: 3,
  };
  let opponent: DuelPlayer = {
    id: 'opponent',
    handle: options.opponentHandle ?? 'Rival',
    lives: 3,
  };
  let submissions: {
    yours: FilterSubmissionStatus;
    theirs: FilterSubmissionStatus;
  } = {
    yours: 'pending',
    theirs: 'pending',
  };
  let expiryTimer: ReturnType<typeof setTimeout> | null = null;
  let opponentTimer: ReturnType<typeof setTimeout> | null = null;

  function schedule(delayMs: number, run: () => void): void {
    const handle = setTimeout(() => {
      timers.delete(handle);
      run();
    }, delayMs);
    timers.add(handle);
  }

  function clearTimers(): void {
    for (const handle of timers) clearTimeout(handle);
    timers.clear();
    expiryTimer = null;
    opponentTimer = null;
  }

  function foundPool(state: EngineState): DuelFoundPlayer[] {
    return foundWithActor(state).map((item) => ({
      ...item.player,
      foundBy: item.foundBy,
    }));
  }

  function sessionOf(state: EngineState): DuelSession {
    if (!state.round) throw new Error('Session has no live round');

    return {
      sessionId: 'duel-1',
      match: maskedMatchFor('home'),
      you: { ...you, lives: state.lives.you },
      opponent: { ...opponent, lives: state.lives.opponent },
      turn: state.turn,
      round: state.round,
      found: foundPool(state),
    };
  }

  function syncPlayers(state: EngineState): void {
    you = { ...you, lives: state.lives.you };
    opponent = { ...opponent, lives: state.lives.opponent };
  }

  function finish(outcome: DuelResult['outcome'], isForfeit: boolean): void {
    if (phase === 'finished') return;
    phase = 'finished';
    clearTimers();

    const state = engine;
    const result: DuelResult = {
      outcome,
      match: SEED_MATCH_IDENTITY,
      found: state ? foundPool(state) : [],
      you,
      opponent,
      isForfeit,
    };

    emitter.emit('finished', result);
  }

  function terminalOutcome(state: EngineState): DuelResult['outcome'] | null {
    if (state.found.length >= SQUAD_SIZE) return 'draw';
    if (state.lives.you <= 0) return 'loss';
    if (state.lives.opponent <= 0) return 'win';
    return null;
  }

  function settle(state: EngineState): boolean {
    const outcome = terminalOutcome(state);
    if (!outcome) return false;

    finish(outcome, false);
    return true;
  }

  function armRound(state: EngineState): void {
    if (expiryTimer) clearTimeout(expiryTimer);
    if (opponentTimer) clearTimeout(opponentTimer);
    if (!state.round) return;

    const remaining = state.round.endsAt + GRACE_WINDOW_MS + 1 - now();
    expiryTimer = setTimeout(() => settleExpiry(), Math.max(0, remaining));
    timers.add(expiryTimer);

    if (state.turn === 'opponent') {
      opponentTimer = setTimeout(() => onOpponentTurn(), thinkTimeMs);
      timers.add(opponentTimer);
    }
  }

  function startRound(state: EngineState): void {
    engine = state;
    syncPlayers(state);
    emitter.emit('roundStarted', sessionOf(state));
    armRound(state);
  }

  // Returns true when a life was charged, so callers know the turn moved
  function settleExpiry(): boolean {
    if (!engine || phase !== 'playing') return false;

    const step = resolveRound(engine, { kind: 'tick' }, now());
    if (step.outcome.kind !== 'expired') return false;

    engine = step.state;
    syncPlayers(step.state);
    emitter.emit('lifeLost', {
      who: step.outcome.actor,
      lives: step.outcome.livesRemaining,
    });

    if (settle(step.state)) return true;

    emitter.emit('turnChanged', sessionOf(step.state));
    startRound(step.state);
    return true;
  }

  function unfoundEntries(state: EngineState) {
    const found = new Set(state.found.map((item) => item.playerId));
    return SEED_SQUAD.filter((entry) => !found.has(entry.playerId));
  }

  function onOpponentTurn(): void {
    if (!engine || phase !== 'playing' || engine.turn !== 'opponent') return;
    if (random() > hitRate) return;

    const candidates = unfoundEntries(engine);
    if (candidates.length === 0) return;

    const pick = candidates[Math.floor(random() * candidates.length)];
    applyGuess('opponent', pick.name);
  }

  function applyGuess(actor: EngineActor, guess: string): void {
    if (!engine) return;

    const step = resolveRound(engine, { kind: 'guess', actor, guess }, now());
    engine = step.state;
    syncPlayers(step.state);

    if (!isGuessable(step.outcome)) return;

    if (actor === 'you') {
      emitter.emit('guessResolved', toGuessResult(step.outcome));
    }

    if (step.outcome.kind !== 'correct_new') {
      if (actor === 'you') armRound(step.state);
      return;
    }

    emitter.emit('playerRevealed', {
      ...step.outcome.player,
      foundBy: step.outcome.foundBy,
    });

    if (settle(step.state)) return;

    emitter.emit('turnChanged', sessionOf(step.state));
    startRound(step.state);
  }

  function beginMatch(): void {
    phase = 'playing';
    const state = createEngineState('duel', SEED_SQUAD, now());
    engine = state;
    syncPlayers(state);
    emitter.emit('matchReady', sessionOf(state));
    armRound(state);

    if (scenario === 'drawOnEleven') schedule(0, () => runDrawScenario());
    if (scenario === 'opponentDisconnects')
      schedule(1_000, () => runDisconnect());
    if (scenario === 'opponentForfeits') {
      schedule(1_000, () => finish('forfeit_win', true));
    }
    if (scenario === 'youDisconnect') {
      schedule(1_000, () => {
        emitter.emit('disconnected', {
          status: 'reconnecting',
          reconnectDeadline: now() + RECONNECT_WINDOW_MS,
        });
      });
    }
  }

  function runDrawScenario(): void {
    if (!engine) return;

    for (const entry of unfoundEntries(engine)) {
      if (phase !== 'playing' || !engine) break;
      applyGuess(engine.turn, entry.name);
    }
  }

  function runDisconnect(): void {
    emitter.emit('opponentConnection', {
      status: 'reconnecting',
      reconnectDeadline: now() + RECONNECT_WINDOW_MS,
    });

    schedule(RECONNECT_WINDOW_MS, () => {
      emitter.emit('opponentConnection', {
        status: 'forfeited',
        reconnectDeadline: null,
      });
      finish('forfeit_win', true);
    });
  }

  return {
    async connect() {
      if (scenario === 'protocolRefused') {
        return fail(
          'forbidden',
          'This version of Lineup is out of date. Update to keep playing.',
        );
      }
      return ACK;
    },

    disconnect() {
      clearTimers();
      emitter.clear();
      phase = 'idle';
      engine = null;
    },

    async enterQueue() {
      if (phase !== 'idle') {
        return fail('forbidden', 'Already in a duel.');
      }

      phase = 'queued';
      emitter.emit('queued', { phase: 'queued', since: now() });

      const enteredAt = now();
      schedule(QUEUE_WAIT_MS, () => {
        if (phase !== 'queued') return;

        if (scenario === 'queueTimeout') {
          emitter.emit('queueTimedOut', {
            phase: 'queued',
            waitedMs: now() - enteredAt,
          });
          phase = 'idle';
          return;
        }

        phase = 'filters';
        emitter.emit('paired', { phase: 'paired', opponent });
      });

      return ACK;
    },

    async leaveQueue() {
      if (phase !== 'queued') {
        return fail('forbidden', 'You are not in the queue.');
      }

      clearTimers();
      phase = 'idle';
      return ACK;
    },

    async submitFilters(filters: Filters) {
      if (phase !== 'filters') {
        return fail('forbidden', 'Filters are not open right now.');
      }

      submissions = { ...submissions, yours: 'submitted' };
      emitter.emit('filtersUpdated', submissions);

      schedule(OPPONENT_FILTER_MS, () => {
        if (phase !== 'filters') return;

        submissions = { ...submissions, theirs: 'submitted' };
        emitter.emit('filtersUpdated', submissions);

        // One set applied whole, never merged (HC 19)
        const winner = random() < 0.5 ? 'you' : 'opponent';
        emitter.emit('coinFlip', { winner, filters });

        beginMatch();
      });

      return ACK;
    },

    async guess(request) {
      const parsed = duelGuessRequestSchema.safeParse(request);
      if (!parsed.success) {
        return fail('invalid_input', 'Type a name before submitting.');
      }

      if (phase !== 'playing' || !engine) {
        return fail('session_over', 'This duel is not running.');
      }

      settleExpiry();

      if (phase !== 'playing' || !engine) {
        return fail('session_over', 'This duel has finished.');
      }

      if (engine.turn !== 'you') {
        return fail('forbidden', 'Wait for your turn.');
      }

      if (scenario === 'rateLimited') {
        const error: ApiError = {
          code: 'rate_limited',
          message: 'Too many guesses at once. Wait a moment.',
          retryAfterMs: 2_000,
        };
        emitter.emit('error', error);
        return { success: false, error };
      }

      applyGuess('you', parsed.data.guess);
      return ACK;
    },

    async forfeit() {
      if (phase !== 'playing') {
        return fail('forbidden', 'There is no duel to forfeit.');
      }

      finish('loss', true);
      return ACK;
    },

    on(event, handler) {
      return emitter.on(event, handler);
    },
  };
}
