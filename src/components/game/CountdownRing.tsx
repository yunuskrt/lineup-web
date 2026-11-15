'use client';

import {
  motion,
  type TargetAndTransition,
  useAnimationFrame,
  useMotionValue,
  useTransform,
} from 'motion/react';
import { useRef, useState } from 'react';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import {
  ARC_SPAN,
  arcDashArray,
  displaySeconds,
  remainingMs,
  ringStage,
  roundDurationMs,
  sweepFraction,
} from '@/lib/countdown';
import { serverClock } from '@/lib/server-clock';
import { TIMER_COLOR_SHIFT, TYPE_NUMBER } from '@/styles/classes';
import type { CountdownStage, RingMode } from '@/types/countdown';
import type { DuelActor } from '@/types/duel';
import type { RoundTiming } from '@/types/game';

// Fits the thickest stage plus its ink edge
const RADIUS = 41;

// An open arc, as game/05-timer-a: the gap at the bottom
const ARC_START_DEGREES = 135;

// The ink edge shows this much either side
const EDGE_WIDTH = 3;

// Weight carries the stage too, not colour alone
const STAGE_WEIGHTS: Record<CountdownStage, number> = {
  calm: 6,
  warning: 9,
  critical: 12,
};

type Tone = { stroke: string; text: string };

const OWNER_TONES: Record<DuelActor, Tone> = {
  you: { stroke: 'stroke-you', text: 'text-fg' },
  opponent: { stroke: 'stroke-opponent', text: 'text-opponent-text' },
};

const STAGE_TONES: Record<Exclude<CountdownStage, 'calm'>, Tone> = {
  warning: { stroke: 'stroke-warning', text: 'text-warning-text' },
  critical: { stroke: 'stroke-danger', text: 'text-danger-text' },
};

const WAITING_TONE: Tone = { stroke: 'stroke-fg-dim', text: 'text-fg-dim' };

const CRITICAL_PULSE: TargetAndTransition = {
  opacity: [1, 0.6, 1],
  transition: { duration: 1, ease: 'easeInOut', repeat: Infinity },
};

const ARC = {
  cx: 50,
  cy: 50,
  r: RADIUS,
  fill: 'none',
  pathLength: 1,
  strokeLinecap: 'round',
  transform: `rotate(${ARC_START_DEGREES} 50 50)`,
} as const;

type CountdownRingProps = {
  round: RoundTiming;
  mode: RingMode;
  owner?: DuelActor;
};

export function CountdownRing({
  round,
  mode,
  owner = 'you',
}: CountdownRingProps) {
  const runs = useMotionPolicy();
  const [seconds, setSeconds] = useState(() =>
    displaySeconds(roundDurationMs(round)),
  );
  // A stopped ring re-reads when handed a new round
  const syncedRound = useRef<RoundTiming | null>(null);
  const fraction = useMotionValue(1);
  const dashArray = useTransform(fraction, arcDashArray);
  // A spent arc would leave a round-cap dot
  const arcOpacity = useTransform(fraction, (value) => (value > 0 ? 1 : 0));

  // Stopped rings still read the clock once
  useAnimationFrame(() => {
    if (mode !== 'running' && syncedRound.current === round) return;
    syncedRound.current = round;

    const remaining = remainingMs(round, serverClock.now());
    fraction.set(sweepFraction(remaining, round));
    setSeconds(displaySeconds(remaining));
  });

  const stage = ringStage(mode, owner, seconds);
  const tone =
    mode === 'waiting'
      ? WAITING_TONE
      : stage === 'calm'
        ? OWNER_TONES[owner]
        : STAGE_TONES[stage];
  const weight = STAGE_WEIGHTS[stage];
  const isPulsing =
    mode === 'running' && stage === 'critical' && runs('ringCriticalPulse');

  return (
    <div
      role="timer"
      aria-label="Time left"
      className="relative flex size-36 shrink-0 flex-col items-center justify-center lg:size-48"
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 size-full"
      >
        <circle
          {...ARC}
          strokeWidth={STAGE_WEIGHTS.calm}
          strokeDasharray={`${ARC_SPAN} 1`}
          className="stroke-rule"
        />
        <motion.g animate={isPulsing ? CRITICAL_PULSE : { opacity: 1 }}>
          <motion.circle
            {...ARC}
            strokeWidth={weight + EDGE_WIDTH}
            strokeDasharray={dashArray}
            style={{ opacity: arcOpacity }}
            className={`stroke-line ${TIMER_COLOR_SHIFT}`}
          />
          <motion.circle
            {...ARC}
            strokeWidth={weight}
            strokeDasharray={dashArray}
            style={{ opacity: arcOpacity }}
            className={`${tone.stroke} ${TIMER_COLOR_SHIFT}`}
          />
        </motion.g>
      </svg>
      <span
        className={`relative text-48 leading-none lg:text-64 ${TYPE_NUMBER} ${tone.text} ${TIMER_COLOR_SHIFT}`}
      >
        {seconds}
      </span>
      <span className="relative text-12 text-fg-muted">seconds</span>
    </div>
  );
}
