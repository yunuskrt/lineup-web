import { useInView } from 'motion/react';
import {
  type RefObject,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  type DemoFrame,
  type DemoTimeline,
  demoFrameAt,
  sameFrame,
} from '@/lib/landing-demo';

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
  const elapsed = useRef(frozenAtMs ?? 0);
  const isRunning =
    isEnabled &&
    frozenAtMs === undefined &&
    isInView &&
    isTabVisible &&
    !isPaused;

  useEffect(() => {
    if (!isRunning) return;
    const startedAt = performance.now();
    const base = elapsed.current;
    let handle = 0;

    const tick = () => {
      elapsed.current = base + (performance.now() - startedAt);
      const next = demoFrameAt(timeline, elapsed.current);
      setFrame((previous) => (sameFrame(previous, next) ? previous : next));
      handle = requestAnimationFrame(tick);
    };

    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [isRunning, timeline]);

  return {
    ref,
    frame,
    isPaused,
    togglePause: () => setIsPaused((paused) => !paused),
  };
}
