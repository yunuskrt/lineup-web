import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useReducer, useRef } from 'react';
import { clearSession, useEnsureSession } from '@/hooks/use-auth';
import { filterOptionsQuery } from '@/hooks/use-filter-options';
import { getApiClient } from '@/lib/api';
import { isSessionLost } from '@/lib/api/session-loss';
import { apiErrorOf, unwrap } from '@/lib/api/unwrap';
import { guessFeedback } from '@/lib/feedback';
import { filtersFromParams, widenFilters, withFilters } from '@/lib/filters';
import { prepareGuess } from '@/lib/guess';
import { serverClock } from '@/lib/server-clock';
import {
  canGuessSolo,
  INITIAL_SOLO_RUN,
  needsResync,
  receiptRoundOf,
  soloRunReducer,
  SYNC_RETRY_MS,
} from '@/lib/solo-run';
import { widenReasonOf } from '@/lib/system-states';
import type { ApiError } from '@/types/api';
import type { GuessFeedback } from '@/types/feedback';
import type { RoundTiming } from '@/types/game';
import type { Side } from '@/types/match';

// Solo calls skip TanStack, so apply its 401 rule
function failureOf(queryClient: QueryClient, error: unknown): ApiError {
  if (isSessionLost(error)) clearSession(queryClient);
  return apiErrorOf(error);
}

// Only a round started on receipt dates the server
function sampleRoundStart(round: RoundTiming | null, sentAt: number) {
  if (round) serverClock.sample(round.startedAt, sentAt, Date.now());
}

export function useSoloRun(params: URLSearchParams) {
  const queryClient = useQueryClient();
  const { mutateAsync: ensureSession } = useEnsureSession();
  const [state, dispatch] = useReducer(soloRunReducer, INITIAL_SOLO_RUN);
  const hasStarted = useRef(false);
  const isFinding = useRef(false);
  const isChoosing = useRef(false);
  const summaryRequestedFor = useRef<string | null>(null);

  const sessionId = state.session?.sessionId ?? null;
  const startedAt = state.session?.round?.startedAt ?? null;
  const endsAt = state.session?.round?.endsAt ?? null;
  const isPlaying = state.phase === 'playing';
  const isAwaitingSummary = state.phase === 'over' && state.summary === null;

  async function find(from: URLSearchParams = params) {
    if (isFinding.current) return;
    isFinding.current = true;
    dispatch({ type: 'finding' });
    try {
      await ensureSession();
      const options = await queryClient.query(filterOptionsQuery);
      const filters = filtersFromParams(from, options);
      const offer = unwrap(await getApiClient().solo.findMatch(filters));
      dispatch({ type: 'offerReceived', offer });
    } catch (error) {
      dispatch({
        type: 'failed',
        step: 'find',
        error: failureOf(queryClient, error),
      });
    } finally {
      isFinding.current = false;
    }
  }

  async function syncNow(id: string) {
    try {
      const session = unwrap(await getApiClient().solo.syncSession(id));
      dispatch({ type: 'synced', session });
    } catch (error) {
      dispatch({
        type: 'failed',
        step: 'sync',
        error: failureOf(queryClient, error),
      });
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
        dispatch({
          type: 'failed',
          step: 'sync',
          error: failureOf(queryClient, error),
        });
      }
    }

    timer = setTimeout(
      () => attempt(sessionId),
      Math.max(0, endsAt - serverClock.now()),
    );
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isPlaying, state.isGuessing, sessionId, startedAt, endsAt, queryClient]);

  // The server set the time; this only unlocks
  useEffect(() => {
    if (state.cooldownUntil === null) return;
    const timer = setTimeout(
      () => dispatch({ type: 'cooldownEnded' }),
      Math.max(0, state.cooldownUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [state.cooldownUntil]);

  // Not cancelled on cleanup: StrictMode would drop it
  useEffect(() => {
    if (!isAwaitingSummary || sessionId === null) return;
    if (summaryRequestedFor.current === sessionId) return;
    summaryRequestedFor.current = sessionId;

    void (async () => {
      try {
        const summary = unwrap(await getApiClient().solo.getSummary(sessionId));
        dispatch({ type: 'summaryReceived', sessionId, summary });
      } catch (error) {
        dispatch({
          type: 'summaryFailed',
          sessionId,
          error: failureOf(queryClient, error),
        });
      }
    })();
  }, [isAwaitingSummary, sessionId, queryClient]);

  async function chooseSide(side: Side) {
    const { offer } = state;
    if (!offer || state.phase !== 'choosing' || isChoosing.current) return;

    isChoosing.current = true;
    try {
      const sentAt = Date.now();
      const session = unwrap(
        await getApiClient().solo.chooseSide(offer.sessionId, side),
      );
      sampleRoundStart(session.round, sentAt);
      dispatch({ type: 'sessionReceived', session });
    } catch (error) {
      dispatch({
        type: 'failed',
        step: 'choose',
        error: failureOf(queryClient, error),
      });
    } finally {
      isChoosing.current = false;
    }
  }

  async function submitGuess(raw: string): Promise<GuessFeedback | null> {
    const guess = prepareGuess(raw);
    if (guess === null || sessionId === null) return null;
    if (!canGuessSolo(state)) return null;

    dispatch({ type: 'guessSubmitted' });
    try {
      const sentAt = Date.now();
      const response = unwrap(
        await getApiClient().solo.guess({ sessionId, guess }),
      );
      sampleRoundStart(receiptRoundOf(response), sentAt);
      dispatch({ type: 'guessResolved', response });
      return guessFeedback(response.result);
    } catch (error) {
      const apiError = failureOf(queryClient, error);
      dispatch({ type: 'guessFailed', error: apiError, at: Date.now() });
      if (apiError.code === 'session_over') await syncNow(sessionId);
      return null;
    }
  }

  // Ends on the summary, like a run that ran out
  async function quit() {
    if (sessionId === null || state.phase === 'over') return;
    if (state.isQuitting) return;

    dispatch({ type: 'quitting' });
    try {
      const summary = unwrap(await getApiClient().solo.quit(sessionId));
      dispatch({ type: 'summaryReceived', sessionId, summary });
    } catch (error) {
      dispatch({
        type: 'failed',
        step: 'quit',
        error: failureOf(queryClient, error),
      });
    }
  }

  function playAgain() {
    if (state.phase !== 'over') return;
    void find();
  }

  // Returns the new params, so the URL can follow
  async function widen(): Promise<URLSearchParams | null> {
    const reason = state.failure ? widenReasonOf(state.failure.error) : null;
    if (!reason || isFinding.current) return null;

    try {
      const options = await queryClient.query(filterOptionsQuery);
      const filters = filtersFromParams(params, options);
      const widened = widenFilters(filters, reason, options);
      if (!widened) return null;

      const next = withFilters(params, widened, options);
      void find(next);
      return next;
    } catch (error) {
      dispatch({
        type: 'failed',
        step: 'find',
        error: failureOf(queryClient, error),
      });
      return null;
    }
  }

  function retry() {
    if (state.failure?.step === 'find') {
      void find();
      return;
    }
    // Lets the summary effect ask again
    if (state.failure?.step === 'summary') summaryRequestedFor.current = null;
    dispatch({ type: 'retried' });
  }

  return { state, chooseSide, submitGuess, quit, playAgain, retry, widen };
}
