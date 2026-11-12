'use client';

import { motion } from 'motion/react';
import { type RefObject, useEffect, useId, useRef } from 'react';
import { Lives } from '@/components/game/Lives';
import { MissedReveal } from '@/components/game/MissedReveal';
import { NamedOrder } from '@/components/game/NamedOrder';
import {
  ResultActions,
  type ResultActionsProps,
} from '@/components/game/ResultActions';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import { summaryTitle } from '@/lib/summary';
import { SKELETON_PULSE, SKELETON_PULSE_OPACITY } from '@/styles/motion';
import type { SoloEndView } from '@/types/canvas';
import type { SoloSummary } from '@/types/solo';

// Fixed heights keep the skeleton in the same box
const OUTCOME_BOX =
  'flex h-24 items-center justify-between gap-4 rounded-md border p-4';
const SKELETON = 'rounded-sm bg-skeleton-fill';

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

function SummarySkeleton() {
  const runs = useMotionPolicy();
  const isPulsing = runs('skeletonPulse');

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
          opacity: isPulsing ? [...SKELETON_PULSE_OPACITY] : 1,
        }}
        transition={isPulsing ? SKELETON_PULSE : undefined}
      >
        <div
          className={`${OUTCOME_BOX} border-skeleton-fill bg-skeleton-fill`}
        />
        <div className="flex flex-col gap-2">
          <span className={`h-5 w-28 ${SKELETON}`} />
          <div className="flex flex-col gap-1">
            {[0, 1, 2].map((index) => (
              <span key={index} className={`h-8 ${SKELETON}`} />
            ))}
          </div>
        </div>
        <span className={`h-10 shrink-0 lg:mt-auto ${SKELETON}`} />
        <div className="flex flex-col items-center gap-3">
          <span className={`h-12 w-full ${SKELETON}`} />
          <span className={`h-5 w-24 ${SKELETON}`} />
        </div>
      </motion.div>
    </div>
  );
}

type RunSummaryProps = ResultActionsProps & {
  end: SoloEndView;
  onRevealMissed: () => void;
};

export function RunSummary({
  end,
  onPlayAgain,
  onChangeFilters,
  capLine,
  onPlayDuel,
  onRevealMissed,
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

  // From lg the pitch sets the height; the list scrolls
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-1 flex-col gap-6 lg:min-h-0 lg:contain-size"
    >
      <Outcome summary={summary} titleId={titleId} titleRef={titleRef} />
      <NamedOrder mode="solo" found={summary.found} />
      <MissedReveal
        summary={summary}
        isRevealed={end.isMissedRevealed}
        onReveal={onRevealMissed}
      />
      <ResultActions
        onPlayAgain={onPlayAgain}
        onChangeFilters={onChangeFilters}
        capLine={capLine}
        onPlayDuel={onPlayDuel}
      />
    </section>
  );
}
