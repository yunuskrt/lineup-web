import type { ApiClient } from '@/lib/api/client';
import {
  SEED_AWAY_CLUB,
  SEED_COMPETITION,
  SEED_HOME_CLUB,
  SEED_MATCH_IDENTITY,
  SEED_SQUAD,
} from '@/lib/api/mock/data/seed';
import {
  createEngineState,
  remainingCount,
  resolveRound,
  revealedPlayers,
  type EngineState,
} from '@/lib/api/mock/engine';
import {
  createSession,
  createStore,
  emptyStats,
  nextId,
  type MockClock,
  type MockStore,
  type StoredSession,
} from '@/lib/api/mock/store';
import {
  ACK,
  fail,
  isGuessable,
  maskedMatchFor,
  ok,
  toGuessResult,
} from '@/lib/api/mock/shared';
import {
  signInRequestSchema,
  signUpRequestSchema,
  upgradeGuestRequestSchema,
} from '@/lib/api/schemas/auth';
import { filtersSchema, SQUAD_SIZE } from '@/lib/api/schemas/common';
import { historyQuerySchema } from '@/lib/api/schemas/profile';
import { soloGuessRequestSchema } from '@/lib/api/schemas/solo';
import type { Session } from '@/types/auth';
import type { Filters } from '@/types/filters';
import type { SoloEndReason } from '@/types/game';
import type { HistoryEntry, HistoryPage } from '@/types/profile';
import type { RevealedPlayer } from '@/types/player';
import type { SoloSession, SoloSummary } from '@/types/solo';

const RATE_LIMIT_WINDOW_MS = 3_000;
const RATE_LIMIT_MAX_GUESSES = 12;

function seasonStartYear(): number {
  return Number.parseInt(SEED_MATCH_IDENTITY.season.slice(0, 4), 10);
}

function narrowFilter(filters: Filters): string | null {
  if (
    filters.competitionIds.length > 0 &&
    !filters.competitionIds.includes(SEED_COMPETITION.id)
  ) {
    return 'competition';
  }

  const seedClubs = [SEED_HOME_CLUB.id, SEED_AWAY_CLUB.id];
  if (
    filters.clubIds.length > 0 &&
    !filters.clubIds.some((id) => seedClubs.includes(id))
  ) {
    return 'club';
  }

  const season = seasonStartYear();
  if (filters.era.from > season || filters.era.to < season) {
    return 'era';
  }

  return null;
}

export function createMockApiClient(
  options: { now?: MockClock } = {},
): ApiClient {
  const now = options.now ?? (() => Date.now());
  const store: MockStore = createStore();

  function requireIdentity() {
    return store.identity;
  }

  function signedInSession(): Session {
    if (!store.identity) throw new Error('No identity');
    return { user: store.identity.user };
  }

  function toSoloSession(session: StoredSession): SoloSession {
    const engine = session.engine;
    if (!engine) throw new Error('Session has no engine state');

    return {
      sessionId: session.id,
      status: engine.status,
      match: maskedMatchFor(session.side ?? 'home'),
      lives: engine.lives.you,
      found: revealedPlayers(engine),
      round: engine.round,
    };
  }

  function missedPlayers(engine: EngineState): RevealedPlayer[] {
    const foundIds = new Set(engine.found.map((item) => item.playerId));
    return SEED_SQUAD.filter((entry) => !foundIds.has(entry.playerId)).map(
      (entry) => ({
        id: entry.playerId,
        name: entry.name,
        slot: entry.slot,
        position: entry.position,
        imageUrl: null,
      }),
    );
  }

  function recordRoundTime(
    session: StoredSession,
    previous: EngineState,
    current: EngineState,
    at: number,
  ): void {
    const previousStart = previous.round?.startedAt ?? null;
    const currentStart = current.round?.startedAt ?? null;
    if (previousStart === null || previousStart === currentStart) return;

    session.roundTimesMs.push(
      Math.max(0, (currentStart ?? at) - previousStart),
    );
  }

  function finalize(session: StoredSession, reason: SoloEndReason): void {
    if (session.isFinalized || !session.engine) return;

    session.isFinalized = true;
    session.endReason = reason;

    const identity = store.identity;
    if (!identity) return;

    const isPerfect = reason === 'perfect_clear';
    const entry: HistoryEntry = {
      id: nextId(store, 'history'),
      playedAt: new Date(now()).toISOString(),
      mode: 'solo',
      match: SEED_MATCH_IDENTITY,
      outcome: reason,
      foundCount: session.engine.found.length,
      livesRemaining: session.engine.lives.you,
    };

    identity.history = [entry, ...identity.history];
    identity.stats = {
      ...identity.stats,
      played: identity.stats.played + 1,
      perfectClears: identity.stats.perfectClears + (isPerfect ? 1 : 0),
      bestStreak: Math.max(identity.stats.bestStreak, session.bestStreak),
      accuracy: accuracyOf(session),
      favouriteClub: SEED_HOME_CLUB,
    };
  }

  function accuracyOf(session: StoredSession): number {
    if (session.totalGuesses === 0) return 0;
    return session.correctGuesses / session.totalGuesses;
  }

  function settleIfOver(session: StoredSession): void {
    const engine = session.engine;
    if (!engine || engine.status !== 'over' || session.isFinalized) return;

    finalize(
      session,
      engine.found.length >= SQUAD_SIZE ? 'perfect_clear' : 'lives_out',
    );
  }

  // Applies any expiry the clock has already caused
  function tick(session: StoredSession, at: number): void {
    if (!session.engine) return;

    const previous = session.engine;
    const step = resolveRound(previous, { kind: 'tick' }, at);
    session.engine = step.state;
    recordRoundTime(session, previous, step.state, at);
    settleIfOver(session);
  }

  function isRateLimited(session: StoredSession, at: number): number | null {
    session.recentGuessTimes = session.recentGuessTimes.filter(
      (time) => at - time < RATE_LIMIT_WINDOW_MS,
    );

    if (session.recentGuessTimes.length < RATE_LIMIT_MAX_GUESSES) {
      session.recentGuessTimes.push(at);
      return null;
    }

    const oldest = session.recentGuessTimes[0];
    return RATE_LIMIT_WINDOW_MS - (at - oldest);
  }

  function summaryOf(session: StoredSession): SoloSummary {
    const engine = session.engine;
    if (!engine) throw new Error('Session has no engine state');

    const isPro = store.identity?.user.tier === 'pro';
    const missed = missedPlayers(engine);

    return {
      match: SEED_MATCH_IDENTITY,
      found: revealedPlayers(engine),
      missedCount: remainingCount(engine),
      missed: isPro ? missed : null,
      livesRemaining: engine.lives.you,
      endReason: session.endReason ?? 'quit',
      accuracy: accuracyOf(session),
      bestStreak: session.bestStreak,
      roundTimesMs: session.roundTimesMs,
    };
  }

  return {
    auth: {
      async getSession() {
        return ok(store.identity ? { user: store.identity.user } : null);
      },

      async continueAsGuest() {
        const id = nextId(store, 'guest');
        store.identity = {
          user: {
            id,
            handle: `Guest ${id.split('-')[1]}`,
            isGuest: true,
            tier: 'free',
          },
          stats: emptyStats(),
          history: [],
        };
        return ok(signedInSession());
      },

      async signIn(request) {
        const parsed = signInRequestSchema.safeParse(request);
        if (!parsed.success) {
          return fail('invalid_input', 'Check your email and password.');
        }

        const id = nextId(store, 'user');
        store.identity = {
          user: {
            id,
            handle: parsed.data.email.split('@')[0],
            isGuest: false,
            tier: 'free',
          },
          stats: emptyStats(),
          history: [],
        };
        return ok(signedInSession());
      },

      async signUp(request) {
        const parsed = signUpRequestSchema.safeParse(request);
        if (!parsed.success) {
          return fail('invalid_input', 'Check the form and try again.');
        }

        const id = nextId(store, 'user');
        store.identity = {
          user: {
            id,
            handle: parsed.data.handle,
            isGuest: false,
            tier: 'free',
          },
          stats: emptyStats(),
          history: [],
        };
        return ok(signedInSession());
      },

      async upgradeGuest(request) {
        const parsed = upgradeGuestRequestSchema.safeParse(request);
        if (!parsed.success) {
          return fail('invalid_input', 'Check the form and try again.');
        }

        const identity = requireIdentity();
        if (!identity) {
          return fail('unauthorized', 'Start a session before upgrading.');
        }

        if (!identity.user.isGuest) {
          return fail('forbidden', 'This account is already registered.');
        }

        // Same identity object, so stats and history survive
        identity.user = {
          ...identity.user,
          handle: parsed.data.handle,
          isGuest: false,
        };
        return ok(signedInSession());
      },

      async signOut() {
        store.identity = null;
        return ACK;
      },
    },

    catalog: {
      async getFilterOptions() {
        const season = seasonStartYear();
        return ok({
          competitions: [SEED_COMPETITION],
          clubs: [SEED_HOME_CLUB, SEED_AWAY_CLUB],
          era: { from: season, to: season },
        });
      },
    },

    solo: {
      async findMatch(filters) {
        const identity = requireIdentity();
        if (!identity) {
          return fail('unauthorized', 'Sign in or continue as a guest first.');
        }

        const parsed = filtersSchema.safeParse(filters);
        if (!parsed.success) {
          return fail('invalid_input', 'Those filters are not valid.');
        }

        const narrow = narrowFilter(parsed.data);
        if (narrow) {
          return fail(
            'empty_pool',
            `No match fits that ${narrow} filter. Try widening it.`,
          );
        }

        const session = createSession(store, identity.user.id);
        return ok({
          sessionId: session.id,
          home: SEED_HOME_CLUB,
          away: SEED_AWAY_CLUB,
        });
      },

      async chooseSide(sessionId, side) {
        const session = store.sessions.get(sessionId);
        if (!session) return fail('not_found', 'That run no longer exists.');

        if (session.engine) {
          return fail('forbidden', 'A side has already been chosen.');
        }

        const at = now();
        session.side = side;
        session.engine = createEngineState('solo', SEED_SQUAD, at);
        session.roundStartedAt = at;

        return ok(toSoloSession(session));
      },

      async guess(request) {
        const parsed = soloGuessRequestSchema.safeParse(request);
        if (!parsed.success) {
          return fail('invalid_input', 'Type a name before submitting.');
        }

        const session = store.sessions.get(parsed.data.sessionId);
        if (!session) return fail('not_found', 'That run no longer exists.');
        if (!session.engine) {
          return fail('invalid_input', 'Choose a side before guessing.');
        }

        const at = now();
        tick(session, at);

        if (session.engine.status === 'over') {
          return fail('session_over', 'This run has already finished.');
        }

        const retryAfterMs = isRateLimited(session, at);
        if (retryAfterMs !== null) {
          return fail(
            'rate_limited',
            'Too many guesses at once. Wait a moment.',
            retryAfterMs,
          );
        }

        const previous = session.engine;
        const step = resolveRound(
          previous,
          { kind: 'guess', actor: 'you', guess: parsed.data.guess },
          at,
        );

        session.engine = step.state;
        recordRoundTime(session, previous, step.state, at);

        if (!isGuessable(step.outcome)) {
          return fail('session_over', 'That round had already ended.');
        }

        const result = toGuessResult(step.outcome);
        session.totalGuesses += 1;

        if (result.outcome === 'correct_new') {
          session.correctGuesses += 1;
          session.currentStreak += 1;
          session.bestStreak = Math.max(
            session.bestStreak,
            session.currentStreak,
          );
        } else {
          session.currentStreak = 0;
        }

        settleIfOver(session);
        return ok({ result, session: toSoloSession(session) });
      },

      async syncSession(sessionId) {
        const session = store.sessions.get(sessionId);
        if (!session) return fail('not_found', 'That run no longer exists.');
        if (!session.engine) {
          return fail('invalid_input', 'Choose a side first.');
        }

        tick(session, now());
        return ok(toSoloSession(session));
      },

      async quit(sessionId) {
        const session = store.sessions.get(sessionId);
        if (!session) return fail('not_found', 'That run no longer exists.');
        if (!session.engine) {
          return fail('invalid_input', 'Choose a side first.');
        }

        const at = now();
        tick(session, at);

        if (!session.isFinalized) {
          session.engine = { ...session.engine, status: 'over', round: null };
          finalize(session, 'quit');
        }

        return ok(summaryOf(session));
      },

      async getSummary(sessionId) {
        const session = store.sessions.get(sessionId);
        if (!session) return fail('not_found', 'That run no longer exists.');
        if (!session.engine) {
          return fail('invalid_input', 'Choose a side first.');
        }

        tick(session, now());

        if (session.engine.status !== 'over') {
          return fail('forbidden', 'This run is still in progress.');
        }

        return ok(summaryOf(session));
      },
    },

    profile: {
      async getProfile() {
        const identity = requireIdentity();
        if (!identity) {
          return fail('unauthorized', 'Sign in to see your profile.');
        }

        return ok({ user: identity.user, stats: identity.stats });
      },

      async getHistory(query) {
        const identity = requireIdentity();
        if (!identity) {
          return fail('unauthorized', 'Sign in to see your history.');
        }

        const parsed = historyQuerySchema.safeParse(query);
        if (!parsed.success) {
          return fail('invalid_input', 'That history query is not valid.');
        }

        return ok(pageOf(identity.history, parsed.data));
      },
    },
  };
}

function pageOf(
  entries: readonly HistoryEntry[],
  query: { cursor: string | null; limit: number },
): HistoryPage {
  const start = query.cursor
    ? entries.findIndex((entry) => entry.id === query.cursor)
    : 0;
  const from = start < 0 ? 0 : start;
  const slice = entries.slice(from, from + query.limit);
  const next = entries[from + query.limit];

  return { entries: slice, nextCursor: next ? next.id : null };
}
