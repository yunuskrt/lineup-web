// In-memory only. A page reload resets every session, stat and history
// entry — that is expected of the mock, not a bug.
import type { EngineState } from '@/lib/api/mock/engine';
import type { ClubRef, Side } from '@/types/match';
import type { HistoryEntry, UserStats } from '@/types/profile';
import type { SoloEndReason } from '@/types/game';
import type { User } from '@/types/user';

export type MockClock = () => number;

export type StoredSession = {
  id: string;
  userId: string;
  fixtureId: string;
  side: Side | null;
  engine: EngineState | null;
  totalGuesses: number;
  correctGuesses: number;
  currentStreak: number;
  bestStreak: number;
  roundTimesMs: number[];
  roundStartedAt: number | null;
  endReason: SoloEndReason | null;
  recentGuessTimes: number[];
  isFinalized: boolean;
};

export type MockIdentity = {
  user: User;
  stats: UserStats;
  history: HistoryEntry[];
  playedAs: ClubRef[];
};

export type MockStore = {
  identity: MockIdentity | null;
  sessions: Map<string, StoredSession>;
  sequence: number;
};

export function createStore(): MockStore {
  return { identity: null, sessions: new Map(), sequence: 0 };
}

export function nextId(store: MockStore, prefix: string): string {
  store.sequence += 1;
  return `${prefix}-${store.sequence}`;
}

function emptyStats(): UserStats {
  return {
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    accuracy: 0,
    bestStreak: 0,
    perfectClears: 0,
    favouriteClub: null,
  };
}

export function createIdentity(user: User): MockIdentity {
  return { user, stats: emptyStats(), history: [], playedAs: [] };
}

// Most-played club; a tie goes to the most recent
export function favouriteClubOf(playedAs: readonly ClubRef[]): ClubRef | null {
  const counts = new Map<string, number>();
  for (const club of playedAs) {
    counts.set(club.id, (counts.get(club.id) ?? 0) + 1);
  }

  const top = Math.max(0, ...counts.values());
  const newestFirst = [...playedAs].reverse();
  return newestFirst.find((club) => counts.get(club.id) === top) ?? null;
}

export function createSession(
  store: MockStore,
  userId: string,
  fixtureId: string,
): StoredSession {
  const session: StoredSession = {
    id: nextId(store, 'session'),
    userId,
    fixtureId,
    side: null,
    engine: null,
    totalGuesses: 0,
    correctGuesses: 0,
    currentStreak: 0,
    bestStreak: 0,
    roundTimesMs: [],
    roundStartedAt: null,
    endReason: null,
    recentGuessTimes: [],
    isFinalized: false,
  };

  store.sessions.set(session.id, session);
  return session;
}
