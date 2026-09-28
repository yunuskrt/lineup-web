import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useReducer, useRef } from 'react';
import { useEnsureSession, useSession } from '@/hooks/use-auth';
import { filterOptionsQuery } from '@/hooks/use-filter-options';
import { getDuelClient, type Unsubscribe } from '@/lib/api/duel-client';
import { apiErrorOf, unwrap } from '@/lib/api/unwrap';
import {
  canLockFilters,
  duelLobbyReducer,
  INITIAL_DUEL_LOBBY,
  PAIRED_BEAT_MS,
  youFrom,
} from '@/lib/duel-lobby';
import { filtersFromParams } from '@/lib/filters';
type Run = { isCancelled: boolean };

export function useDuelLobby(params: URLSearchParams) {
  const queryClient = useQueryClient();
  const { mutateAsync: ensureSession } = useEnsureSession();
  const session = useSession();
  const [state, dispatch] = useReducer(duelLobbyReducer, INITIAL_DUEL_LOBBY);
  const run = useRef<Run>({ isCancelled: false });
  const subscriptions = useRef<Unsubscribe[]>([]);
  const isLocking = useRef(false);

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
      client.on('error', (error) => dispatch({ type: 'error', error })),
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

  const startLobby = useEffectEvent((current: Run) => {
    subscribe();
    void start(current);
  });

  // The latest run, which a retry may have replaced
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

  async function lockFilters() {
    const { filters } = state;
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

  function searchAgain() {
    if (state.phase !== 'noOpponent') return;
    dispatch({ type: 'started' });
    void enterQueue(run.current);
  }

  // Leaving the queue is best-effort; disconnect ends it
  async function leave() {
    const current = run.current;
    current.isCancelled = true;
    if (state.phase === 'searching') await getDuelClient().leaveQueue();
    release();
  }

  function retry() {
    if (state.failure?.step === 'lock') {
      void lockFilters();
      return;
    }
    release();
    const current: Run = { isCancelled: false };
    run.current = current;
    subscribe();
    void start(current);
  }

  return {
    state,
    you: youFrom(session.data?.user ?? null),
    lockFilters,
    searchAgain,
    leave,
    retry,
  };
}
