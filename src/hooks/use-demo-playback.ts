import { useInView } from 'motion/react';
import {
  type RefObject,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ROUND_MS, UNSTARTED_ROUND } from '@/lib/canvas';
import {
  type DemoFrame,
  type DemoTimeline,
  demoFrameAt,
  sameFrame,
} from '@/lib/landing-demo';
import { serverClock } from '@/lib/server-clock';
import type { RingMode } from '@/types/countdown';
import type { RoundTiming } from '@/types/game';

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

const isTabShown = () => document.visibilityState === 'visible';

export type DemoPlaybackOptions = {
  isEnabled: boolean;
  startsPaused?: boolean;
  // Dev snapshots: one moment, never played
  frozenAtMs?: number;
};

export type DemoPlayback = {
  ref: RefObject<HTMLElement | null>;
  frame: DemoFrame;
  round: RoundTiming;
  ringMode: RingMode;
  isPaused: boolean;
  togglePause: () => void;
};

// One frame loop; React hears only real changes
export function useDemoPlayback(
  timeline: DemoTimeline,
  { isEnabled, startsPaused = false, frozenAtMs }: DemoPlaybackOptions,
): DemoPlayback {
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.5 });
  const isTabVisible = useSyncExternalStore(
    subscribeVisibility,
    isTabShown,
    () => true,
  );
  const [isPaused, setIsPaused] = useState(startsPaused);
  const [frame, setFrame] = useState(() =>
    demoFrameAt(timeline, frozenAtMs ?? 0),
  );
  // The clock time elapsed 0 maps to, per run
  const [clockAtZero, setClockAtZero] = useState<number | null>(() =>
    frozenAtMs === undefined ? null : serverClock.now() - frozenAtMs,
  );
  // Running only once this run's clock is set
  const [isTicking, setIsTicking] = useState(false);
  const elapsed = useRef(frozenAtMs ?? 0);
  const isRunning =
    isEnabled &&
    frozenAtMs === undefined &&
    isInView &&
    isTabVisible &&
    !isPaused;

  useEffect(() => {
    if (!isRunning) return;
    const startedAt = serverClock.now();
    const base = elapsed.current;
    let isFirstTick = true;
    let handle = 0;

    const tick = () => {
      if (isFirstTick) {
        isFirstTick = false;
        setClockAtZero(startedAt - base);
        setIsTicking(true);
      }
      elapsed.current = base + (serverClock.now() - startedAt);
      const next = demoFrameAt(timeline, elapsed.current);
      setFrame((previous) => (sameFrame(previous, next) ? previous : next));
      handle = requestAnimationFrame(tick);
    };

    handle = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(handle);
      setIsTicking(false);
    };
  }, [isRunning, timeline]);

  const roundStartedAt =
    clockAtZero === null ? null : clockAtZero + frame.roundStartMs;
  const [round, setRound] = useState<RoundTiming>(UNSTARTED_ROUND);
  // A new object only when the round really moves
  if (roundStartedAt !== null && round.startedAt !== roundStartedAt) {
    setRound({
      startedAt: roundStartedAt,
      endsAt: roundStartedAt + ROUND_MS,
    });
  }

  return {
    ref,
    frame,
    round,
    ringMode: isRunning && isTicking ? 'running' : 'frozen',
    isPaused,
    togglePause: () => setIsPaused((paused) => !paused),
  };
}
