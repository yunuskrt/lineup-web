import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useReducer, useRef } from 'react';
import { useEnsureSession } from '@/hooks/use-auth';
import { filterOptionsQuery } from '@/hooks/use-filter-options';
import { getApiClient } from '@/lib/api';
import { apiErrorOf, unwrap } from '@/lib/api/unwrap';
import { guessFeedback } from '@/lib/feedback';
import { filtersFromParams } from '@/lib/filters';
import { prepareGuess } from '@/lib/guess';
import {
  INITIAL_SOLO_RUN,
  needsResync,
  soloRunReducer,
  SYNC_RETRY_MS,
} from '@/lib/solo-run';
import type { GuessFeedback } from '@/types/feedback';
import type { Side } from '@/types/match';

export function useSoloRun(params: URLSearchParams) {
  const queryClient = useQueryClient();
  const { mutateAsync: ensureSession } = useEnsureSession();
  const [state, dispatch] = useReducer(soloRunReducer, INITIAL_SOLO_RUN);
  const hasStarted = useRef(false);
  const isChoosing = useRef(false);

  const sessionId = state.session?.sessionId ?? null;
  const startedAt = state.session?.round?.startedAt ?? null;
  const endsAt = state.session?.round?.endsAt ?? null;
  const isPlaying = state.phase === 'playing';

  async function find() {
    dispatch({ type: 'finding' });
    try {
      await ensureSession();
      const options = await queryClient.query(filterOptionsQuery);
      const filters = filtersFromParams(params, options);
      const offer = unwrap(await getApiClient().solo.findMatch(filters));
      dispatch({ type: 'offerReceived', offer });
    } catch (error) {
      dispatch({ type: 'failed', step: 'find', error: apiErrorOf(error) });
    }
  }

  async function syncNow(id: string) {
    try {
      const session = unwrap(await getApiClient().solo.syncSession(id));
      dispatch({ type: 'synced', session });
    } catch (error) {
      dispatch({ type: 'failed', step: 'sync', error: apiErrorOf(error) });
    }
  }

  const startRun = useEffectEvent(() => void find());

  useEffect(() => {
    // StrictMode remounts; start only one run
    if (hasStarted.current) return;
    hasStarted.current = true;
    startRun();
  }, []);

  // At 0 the server decides; the client only asks
  useEffect(() => {
    if (!isPlaying || state.isGuessing) return;
    if (sessionId === null || startedAt === null || endsAt === null) return;

    const held = { startedAt, endsAt };
    let isCancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function attempt(id: string) {
      try {
        const session = unwrap(await getApiClient().solo.syncSession(id));
        if (isCancelled) return;
        dispatch({ type: 'synced', session });
        if (needsResync(held, session)) {
          timer = setTimeout(() => attempt(id), SYNC_RETRY_MS);
        }
      } catch (error) {
        if (isCancelled) return;
        dispatch({ type: 'failed', step: 'sync', error: apiErrorOf(error) });
      }
    }

    timer = setTimeout(
      () => attempt(sessionId),
      Math.max(0, endsAt - Date.now()),
    );
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isPlaying, state.isGuessing, sessionId, startedAt, endsAt]);

  async function chooseSide(side: Side) {
    const { offer } = state;
    if (!offer || state.phase !== 'choosing' || isChoosing.current) return;

    isChoosing.current = true;
    try {
      const session = unwrap(
        await getApiClient().solo.chooseSide(offer.sessionId, side),
      );
      dispatch({ type: 'sessionReceived', session });
    } catch (error) {
      dispatch({ type: 'failed', step: 'choose', error: apiErrorOf(error) });
    } finally {
      isChoosing.current = false;
    }
  }

  async function submitGuess(raw: string): Promise<GuessFeedback | null> {
    const guess = prepareGuess(raw);
    if (guess === null || sessionId === null) return null;
    if (!isPlaying || state.isGuessing) return null;

    dispatch({ type: 'guessSubmitted' });
    try {
      const response = unwrap(
        await getApiClient().solo.guess({ sessionId, guess }),
      );
      dispatch({ type: 'guessResolved', response });
      return guessFeedback(response.result);
    } catch (error) {
      const apiError = apiErrorOf(error);
      dispatch({ type: 'guessFailed', error: apiError });
      if (apiError.code === 'session_over') await syncNow(sessionId);
      return null;
    }
  }

  // Resolves true once there is no run left to end
  async function quit(): Promise<boolean> {
    if (sessionId === null || state.phase === 'over') return true;

    try {
      unwrap(await getApiClient().solo.quit(sessionId));
      return true;
    } catch (error) {
      dispatch({ type: 'failed', step: 'quit', error: apiErrorOf(error) });
      return false;
    }
  }

  function retry() {
    if (state.failure?.step === 'find') {
      void find();
      return;
    }
    dispatch({ type: 'retried' });
  }

  return { state, chooseSide, submitGuess, quit, retry };
}
