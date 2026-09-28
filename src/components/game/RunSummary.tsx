'use client';

import { motion, type Transition, useReducedMotion } from 'motion/react';
import { type RefObject, useEffect, useId, useRef } from 'react';
import { Lives } from '@/components/game/Lives';
import {
  ResultActions,
  type ResultActionsProps,
} from '@/components/game/ResultActions';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import {
  accuracyLabel,
  roundSecondsLabel,
  roundTimeBars,
  roundTimeStats,
  summaryTitle,
} from '@/lib/summary';
import {
  MOTION_EASING,
  MOTION_SECONDS,
  SKELETON_PULSE_OPACITY,
} from '@/styles/motion';
import type { SoloEndView } from '@/types/canvas';
import type { SoloSummary } from '@/types/solo';

// Fixed heights keep the skeleton in the same box
const OUTCOME_BOX =
  'flex h-24 items-center justify-between gap-4 rounded-md border p-4';
const STAT_LABEL = 'text-12 leading-4 text-fg-muted';
const STAT_VALUE = 'font-display text-24 leading-8 font-semibold tabular-nums';
const STRIP_BOX = 'flex h-16 gap-1';
const SKELETON = 'rounded-sm bg-skeleton-fill';

const SKELETON_PULSE: Transition = {
  duration: MOTION_SECONDS.skeletonPulse,
  ease: MOTION_EASING.skeletonPulse,
  repeat: Infinity,
};

type OutcomeProps = {
  summary: SoloSummary;
  titleId: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
};

function Outcome({ summary, titleId, titleRef }: OutcomeProps) {
  const isPerfect = summary.endReason === 'perfect_clear';
  const lives = summary.livesRemaining;

  return (
    <div
      className={`${OUTCOME_BOX} ${
        isPerfect
          ? 'border-found bg-found text-on-accent'
          : 'border-line bg-surface-card text-fg'
      }`}
    >
      <div className="flex min-w-0 flex-col">
        <h2
          ref={titleRef}
          id={titleId}
          tabIndex={-1}
          className="font-display text-32 leading-10 font-semibold outline-none"
        >
          {summaryTitle(summary.endReason)}
        </h2>
        <p className={`text-14 leading-5 ${isPerfect ? '' : 'text-fg-muted'}`}>
          You named {summary.found.length} of {SQUAD_SIZE}.
        </p>
      </div>
      {isPerfect ? (
        <p className="flex shrink-0 flex-col items-end">
          <span className="font-display text-48 leading-none font-semibold tabular-nums">
            {lives}
          </span>
          <span className="text-12 leading-4 font-medium">
            {lives === 1 ? 'life left' : 'lives left'}
          </span>
        </p>
      ) : (
        <Lives lives={lives} />
      )}
    </div>
  );
}

function Stats({ summary }: { summary: SoloSummary }) {
  const stats = [
    { label: 'Accuracy', value: accuracyLabel(summary.accuracy) },
    { label: 'Best streak', value: String(summary.bestStreak) },
    { label: 'Missed', value: String(summary.missedCount) },
  ];

  return (
    <dl className="grid grid-cols-3 gap-2">
      {stats.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className={STAT_LABEL}>{label}</dt>
          <dd className={STAT_VALUE}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RoundStrip({ roundTimesMs }: { roundTimesMs: number[] }) {
  const headingId = useId();
  const bars = roundTimeBars(roundTimesMs);
  const stats = roundTimeStats(roundTimesMs);
  const fastestIndex = stats ? roundTimesMs.indexOf(stats.fastestMs) : -1;

  return (
    <div className="flex flex-col gap-2">
      <h3 id={headingId} className="text-14 leading-5 font-medium text-fg">
        Time per round
      </h3>
      {bars.length > 0 ? (
        <ol aria-labelledby={headingId} className={`${STRIP_BOX} items-end`}>
          {bars.map((share, index) => (
            <li
              key={index}
              className="relative h-full min-w-0 flex-1 overflow-hidden rounded-sm bg-surface-card"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 origin-bottom ${
                  index === fastestIndex ? 'bg-fg' : 'bg-fg-muted'
                }`}
                style={{ transform: `scaleY(${share})` }}
              />
              <span className="sr-only">
                Round {index + 1}, {roundSecondsLabel(roundTimesMs[index])}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className={`${STRIP_BOX} items-center text-14 text-fg-muted`}>
          No rounds played
        </p>
      )}
      <p className="flex h-4 justify-between text-12 leading-4 text-fg-muted">
        {stats ? (
          <>
            <span>Average {roundSecondsLabel(stats.averageMs)}</span>
            <span>Fastest {roundSecondsLabel(stats.fastestMs)}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

function SummarySkeleton() {
  const isReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-1 flex-col">
      <p role="status" className="sr-only">
        Loading your summary
      </p>
      <motion.div
        aria-hidden="true"
        className="flex flex-1 flex-col gap-6"
        initial={false}
        animate={{
          opacity: isReducedMotion ? 1 : [...SKELETON_PULSE_OPACITY],
        }}
        transition={isReducedMotion ? undefined : SKELETON_PULSE}
      >
        <div
          className={`${OUTCOME_BOX} border-skeleton-fill bg-skeleton-fill`}
        />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex flex-col gap-1">
              <span className={`h-4 w-14 ${SKELETON}`} />
              <span className={`h-8 w-12 ${SKELETON}`} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className={`h-5 w-28 ${SKELETON}`} />
          <span className={`h-16 ${SKELETON}`} />
          <span className={`h-4 w-full ${SKELETON}`} />
        </div>
        <div className="flex flex-col items-center gap-3 lg:mt-auto">
          <span className={`h-12 w-full ${SKELETON}`} />
          <span className={`h-5 w-24 ${SKELETON}`} />
        </div>
      </motion.div>
    </div>
  );
}

type RunSummaryProps = ResultActionsProps & {
  end: SoloEndView;
};

export function RunSummary({
  end,
  onPlayAgain,
  onChangeFilters,
}: RunSummaryProps) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isReady = end.status === 'ready';

  // Not Play again: a held Enter would start a run
  useEffect(() => {
    if (isReady) titleRef.current?.focus();
  }, [isReady]);

  if (end.status === 'loading') return <SummarySkeleton />;

  const { summary } = end;

  return (
    <section aria-labelledby={titleId} className="flex flex-1 flex-col gap-6">
      <Outcome summary={summary} titleId={titleId} titleRef={titleRef} />
      <Stats summary={summary} />
      <RoundStrip roundTimesMs={summary.roundTimesMs} />
      <ResultActions
        onPlayAgain={onPlayAgain}
        onChangeFilters={onChangeFilters}
      />
    </section>
  );
}
