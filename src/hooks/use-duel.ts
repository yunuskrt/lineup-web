import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useReducer, useRef } from 'react';
import { useEnsureSession, useSession } from '@/hooks/use-auth';
import { filterOptionsQuery } from '@/hooks/use-filter-options';
import { getDuelClient, type Unsubscribe } from '@/lib/api/duel-client';
import { apiErrorOf, unwrap } from '@/lib/api/unwrap';
import {
  canForfeit,
  canGuess,
  duelGateAction,
  canLockFilters,
  duelSessionReducer,
  INITIAL_DUEL_SESSION,
  PAIRED_BEAT_MS,
  youFrom,
} from '@/lib/duel-session';
import { filtersFromParams, widenFilters, withFilters } from '@/lib/filters';
import { prepareGuess } from '@/lib/guess';
import { widenReasonOf } from '@/lib/system-states';
import type { Filters } from '@/types/filters';

type Run = { isCancelled: boolean };

export function useDuel(params: URLSearchParams) {
  const queryClient = useQueryClient();
  const { mutateAsync: ensureSession } = useEnsureSession();
  const session = useSession();
  const [state, dispatch] = useReducer(
    duelSessionReducer,
    INITIAL_DUEL_SESSION,
  );
  const run = useRef<Run>({ isCancelled: false });
  const subscriptions = useRef<Unsubscribe[]>([]);
  const isLocking = useRef(false);
  const isGuessing = useRef(false);
  const isForfeiting = useRef(false);

  function subscribe() {
    const client = getDuelClient();
    subscriptions.current = [
      client.on('queued', () => dispatch({ type: 'queued' })),
      client.on('queueTimedOut', () => dispatch({ type: 'queueTimedOut' })),
      client.on('paired', ({ opponent }) =>
        dispatch({ type: 'paired', opponent }),
      ),
      client.on('filtersUpdated', (submission) =>
        dispatch({ type: 'filtersUpdated', submission }),
      ),
      client.on('coinFlip', (result) => dispatch({ type: 'coinFlip', result })),
      client.on('matchReady', (duel) =>
        dispatch({ type: 'matchReady', session: duel }),
      ),
      client.on('roundStarted', (duel) =>
        dispatch({ type: 'roundStarted', session: duel }),
      ),
      client.on('turnChanged', (duel) =>
        dispatch({ type: 'turnChanged', session: duel }),
      ),
      client.on('guessResolved', (result) =>
        dispatch({ type: 'guessResolved', result }),
      ),
      client.on('lifeLost', (cue) => dispatch({ type: 'lifeLost', cue })),
      client.on('opponentConnection', (connection) =>
        dispatch({ type: 'opponentConnection', connection }),
      ),
      client.on('finished', (result) => dispatch({ type: 'finished', result })),
      client.on('error', (error) =>
        dispatch({ type: 'error', error, at: Date.now() }),
      ),
    ];
  }

  // Unsubscribes and drops the adapter's timers
  function release() {
    for (const unsubscribe of subscriptions.current) unsubscribe();
    subscriptions.current = [];
    getDuelClient().disconnect();
  }

  async function enterQueue(current: Run) {
    try {
      unwrap(await getDuelClient().enterQueue());
    } catch (error) {
      if (current.isCancelled) return;
      dispatch({ type: 'failed', step: 'queue', error: apiErrorOf(error) });
    }
  }

  async function start(current: Run) {
    dispatch({ type: 'started' });
    try {
      await ensureSession();
      const options = await queryClient.query(filterOptionsQuery);
      if (current.isCancelled) return;
      dispatch({
        type: 'prepared',
        filters: filtersFromParams(params, options),
        options,
      });
      unwrap(await getDuelClient().connect());
    } catch (error) {
      if (current.isCancelled) return;
      dispatch({ type: 'failed', step: 'connect', error: apiErrorOf(error) });
      return;
    }
    if (current.isCancelled) return;
    await enterQueue(current);
  }

  // Drops whatever ran before and starts fresh
  function restart() {
    release();
    const current: Run = { isCancelled: false };
    run.current = current;
    subscribe();
    void start(current);
  }

  const startLobby = useEffectEvent((current: Run) => {
    subscribe();
    void start(current);
  });

  // The latest run, which a restart may have replaced
  const stopLobby = useEffectEvent(() => {
    run.current.isCancelled = true;
    release();
  });

  // Deferred, so StrictMode's first mount never starts
  useEffect(() => {
    const current: Run = { isCancelled: false };
    run.current = current;
    const timer = setTimeout(() => startLobby(current));
    return () => {
      clearTimeout(timer);
      stopLobby();
    };
  }, []);

  useEffect(() => {
    if (state.phase !== 'paired') return;
    const timer = setTimeout(
      () => dispatch({ type: 'filtersOpened' }),
      PAIRED_BEAT_MS,
    );
    return () => clearTimeout(timer);
  }, [state.phase]);

  // The server set the time; this only unlocks
  useEffect(() => {
    if (state.cooldownUntil === null) return;
    const timer = setTimeout(
      () => dispatch({ type: 'cooldownEnded' }),
      Math.max(0, state.cooldownUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [state.cooldownUntil]);

  async function lockFilters(filters: Filters | null = state.filters) {
    if (!canLockFilters(state) || !filters || isLocking.current) return;

    isLocking.current = true;
    dispatch({ type: 'locking' });
    try {
      unwrap(await getDuelClient().submitFilters(filters));
    } catch (error) {
      if (!run.current.isCancelled) {
        dispatch({ type: 'failed', step: 'lock', error: apiErrorOf(error) });
      }
    } finally {
      isLocking.current = false;
    }
  }

  // The verdict arrives as `guessResolved`, not here
  async function submitGuess(raw: string) {
    const guess = prepareGuess(raw);
    const sessionId = state.session?.sessionId;
    if (guess === null || !sessionId || !canGuess(state)) return;
    if (isGuessing.current) return;

    isGuessing.current = true;
    dispatch({ type: 'guessSubmitted' });
    try {
      unwrap(await getDuelClient().guess({ sessionId, guess }));
    } catch (error) {
      if (!run.current.isCancelled) {
        dispatch({
          type: 'guessFailed',
          error: apiErrorOf(error),
          at: Date.now(),
        });
      }
    } finally {
      isGuessing.current = false;
    }
  }

  // Ends on the result the server sends back
  async function forfeit() {
    if (!canForfeit(state) || isForfeiting.current) return;

    isForfeiting.current = true;
    dispatch({ type: 'forfeiting' });
    try {
      unwrap(await getDuelClient().forfeit());
    } catch (error) {
      if (!run.current.isCancelled) {
        dispatch({ type: 'failed', step: 'forfeit', error: apiErrorOf(error) });
      }
    } finally {
      isForfeiting.current = false;
    }
  }

  // Returns the new params, so the URL can follow
  function widen(): URLSearchParams | null {
    const { filters, options, failure } = state;
    if (duelGateAction(state) !== 'widen' || !failure) return null;
    const reason = widenReasonOf(failure.error);
    if (!reason || !filters || !options) return null;

    const widened = widenFilters(filters, reason, options);
    if (!widened) return null;
    dispatch({ type: 'filtersWidened', filters: widened });
    void lockFilters(widened);
    return withFilters(params, widened, options);
  }

  function searchAgain() {
    if (state.phase !== 'noOpponent') return;
    dispatch({ type: 'started' });
    void enterQueue(run.current);
  }

  function playAgain() {
    if (state.phase !== 'finished') return;
    restart();
  }

  // Leaving the queue is best-effort; disconnect ends it
  async function leave() {
    const current = run.current;
    current.isCancelled = true;
    if (state.phase === 'searching') await getDuelClient().leaveQueue();
    release();
  }

  function retry() {
    switch (state.failure?.step) {
      case 'lock':
        void lockFilters();
        return;
      case 'forfeit':
        void forfeit();
        return;
      default:
        restart();
    }
  }

  return {
    state,
    you: youFrom(session.data?.user ?? null),
    lockFilters: () => lockFilters(),
    submitGuess,
    forfeit,
    searchAgain,
    playAgain,
    leave,
    retry,
    widen,
  };
}
