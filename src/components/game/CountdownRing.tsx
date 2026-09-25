'use client';

import {
  motion,
  type TargetAndTransition,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { useRef, useState } from 'react';
import {
  countdownStage,
  displaySeconds,
  remainingMs,
  roundDurationMs,
  sweepFraction,
} from '@/lib/countdown';
import { MOTION_DURATION_MS, MOTION_EASING } from '@/styles/motion';
import type { CountdownStage, RingMode } from '@/types/countdown';
import type { DuelActor } from '@/types/duel';
import type { RoundTiming } from '@/types/game';

const RADIUS = 46;
const STROKE_WIDTH = 5;

const STAGE_TONES: Record<CountdownStage, { stroke: string; text: string }> = {
  calm: { stroke: 'stroke-fg', text: 'text-fg' },
  warning: { stroke: 'stroke-warning', text: 'text-warning' },
  critical: { stroke: 'stroke-danger', text: 'text-danger' },
};

const OPPONENT_TONE = { stroke: 'stroke-opponent', text: 'text-opponent' };
const WAITING_TONE = { stroke: 'stroke-fg-dim', text: 'text-fg-dim' };

const COLOR_SHIFT = {
  transitionProperty: 'stroke, color',
  transitionDuration: `${MOTION_DURATION_MS.timerColorShift}ms`,
  transitionTimingFunction: `cubic-bezier(${MOTION_EASING.timerColorShift.join(', ')})`,
};

const CRITICAL_PULSE: TargetAndTransition = {
  opacity: [1, 0.6, 1],
  transition: { duration: 1, ease: 'easeInOut', repeat: Infinity },
};

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
  const isReducedMotion = useReducedMotion();
  const [seconds, setSeconds] = useState(() =>
    displaySeconds(roundDurationMs(round)),
  );
  const hasSynced = useRef(false);
  const fraction = useMotionValue(1);
  const offset = useTransform(fraction, (value) => 1 - value);

  // Stopped rings still read the clock once, on their first frame
  useAnimationFrame(() => {
    if (mode !== 'running' && hasSynced.current) return;
    hasSynced.current = true;

    const remaining = remainingMs(round, Date.now());
    fraction.set(sweepFraction(remaining, round));
    setSeconds(displaySeconds(remaining));
  });

  const stage = countdownStage(seconds);
  const tone =
    mode === 'waiting'
      ? WAITING_TONE
      : owner === 'opponent'
        ? OPPONENT_TONE
        : STAGE_TONES[stage];
  const isPulsing =
    mode === 'running' &&
    owner === 'you' &&
    stage === 'critical' &&
    !isReducedMotion;

  return (
    <div
      role="timer"
      aria-label="Time left"
      className="relative flex size-36 shrink-0 items-center justify-center"
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          className="fill-none stroke-line"
        />
        {/* The offset moves the start, so the gap grows clockwise from 12 */}
        <motion.circle
          cx="50"
          cy="50"
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          className={`fill-none ${tone.stroke}`}
          style={{ ...COLOR_SHIFT, pathLength: fraction, pathOffset: offset }}
          animate={isPulsing ? CRITICAL_PULSE : { opacity: 1 }}
        />
      </svg>
      <span
        className={`relative font-display text-64 leading-none font-semibold tabular-nums ${tone.text}`}
        style={COLOR_SHIFT}
      >
        {seconds}
      </span>
    </div>
  );
}
