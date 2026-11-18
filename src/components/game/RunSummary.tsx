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
import { pluralOf } from '@/lib/plural';
import { accuracyLabel, summaryTitle } from '@/lib/summary';
import { RAIL_SECTION, TYPE_NUMBER } from '@/styles/classes';
import { SKELETON_PULSE, SKELETON_PULSE_OPACITY } from '@/styles/motion';
import type { SoloEndView } from '@/types/canvas';
import type { SoloSummary } from '@/types/solo';
import { Badge } from '@/components/ui/badge';
import { SKELETON } from '@/components/ui/skeleton';

// Fixed heights keep the skeleton in the same boxes
export const OUTCOME_BOX = `relative flex h-24 items-center justify-between gap-4 border-b-2 border-line -mt-3 sm:-mt-4 ${RAIL_SECTION}`;

const STATS_BOX = `grid h-18 grid-cols-2 border-b-2 border-line ${RAIL_SECTION}`;

// The 352px rail can't take TYPE_TITLE's 40px
export const OUTCOME_TITLE =
  'font-display text-24 leading-tight font-extrabold font-stretch-semi-expanded outline-none min-[360px]:text-30';

type OutcomeProps = {
  summary: SoloSummary;
  titleId: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
};

function Outcome({ summary, titleId, titleRef }: OutcomeProps) {
  const isPerfect = summary.endReason === 'perfect_clear';
  const lives = summary.livesRemaining;

  return (
    // A perfect clear takes the block in green, edge to edge
    <div
      className={`${OUTCOME_BOX} ${isPerfect ? 'bg-found text-on-accent' : 'text-fg'}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 ref={titleRef} id={titleId} tabIndex={-1} className={OUTCOME_TITLE}>
          {summaryTitle(summary.endReason)}
        </h2>
        <p className={`text-14 leading-5 ${isPerfect ? '' : 'text-fg-muted'}`}>
          You named {summary.found.length} of {SQUAD_SIZE}.
        </p>
      </div>
      {/* No lives in practice: the tag stands in */}
      {summary.practice ? (
        <Badge variant="sticker" tone={isPerfect ? 'neutral' : 'mint'}>
          Practice
        </Badge>
      ) : isPerfect ? (
        <p className="flex shrink-0 flex-col items-end">
          <span className={`text-48 leading-none ${TYPE_NUMBER}`}>{lives}</span>
          <span className="text-12 leading-4 font-medium">
            {pluralOf(lives, 'life left', 'lives left')}
          </span>
        </p>
      ) : (
        <Lives lives={lives} />
      )}
    </div>
  );
}

type StatProps = {
  label: string;
  value: string;
};

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col justify-center gap-0.5 px-1 first:border-r-2 first:border-line last:pl-4">
      <dt className="text-12 leading-4 font-medium text-fg-muted uppercase">
        {label}
      </dt>
      <dd className={`text-28 leading-none ${TYPE_NUMBER}`}>{value}</dd>
    </div>
  );
}

function Stats({ summary }: { summary: SoloSummary }) {
  return (
    <dl className={STATS_BOX}>
      <Stat label="Accuracy" value={accuracyLabel(summary.accuracy)} />
      <Stat label="Best streak" value={String(summary.bestStreak)} />
    </dl>
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
        className="flex flex-1 flex-col gap-4"
        initial={false}
        animate={{
          opacity: isPulsing ? [...SKELETON_PULSE_OPACITY] : 1,
        }}
        transition={isPulsing ? SKELETON_PULSE : undefined}
      >
        <div className={OUTCOME_BOX}>
          <div className="flex flex-col gap-2">
            <span className={`h-7 w-40 ${SKELETON}`} />
            <span className={`h-4 w-28 ${SKELETON}`} />
          </div>
          <span className={`h-6 w-18 ${SKELETON}`} />
        </div>
        <div className={STATS_BOX}>
          <span className={`my-auto h-10 w-24 ${SKELETON}`} />
          <span className={`my-auto h-10 w-24 ${SKELETON}`} />
        </div>
        <div className="flex flex-col gap-1">
          <span className={`h-5 w-28 ${SKELETON}`} />
          {[0, 1, 2].map((index) => (
            <span key={index} className={`my-1 h-8 ${SKELETON}`} />
          ))}
        </div>
        <div
          className={`flex flex-col gap-3 border-t-2 border-line pt-3 sm:pt-4 lg:mt-auto ${RAIL_SECTION}`}
        >
          <span className={`h-12 w-full ${SKELETON}`} />
          <span className={`h-12 w-full ${SKELETON}`} />
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
  onBackToPlay,
  capLine,
  onPlayDuel,
  isPicked,
  isPractice,
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
      className="flex flex-1 flex-col gap-4 lg:min-h-0 lg:contain-size"
    >
      <Outcome summary={summary} titleId={titleId} titleRef={titleRef} />
      <Stats summary={summary} />
      <NamedOrder
        mode="solo"
        found={summary.found}
        missedCount={summary.missedCount}
      />
      <MissedReveal
        summary={summary}
        isRevealed={end.isMissedRevealed}
        onReveal={onRevealMissed}
      />
      <div
        className={`flex flex-col border-t-2 border-line pt-3 sm:pt-4 lg:mt-auto ${RAIL_SECTION}`}
      >
        <ResultActions
          onPlayAgain={onPlayAgain}
          onChangeFilters={onChangeFilters}
          onBackToPlay={onBackToPlay}
          capLine={capLine}
          onPlayDuel={onPlayDuel}
          isPicked={isPicked}
          isPractice={isPractice}
        />
      </div>
    </section>
  );
}
