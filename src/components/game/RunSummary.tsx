'use client';

import React, { useEffect, useId, useRef } from 'react';
import MissedReveal from '@/components/game/MissedReveal';
import NamedOrder from '@/components/game/NamedOrder';
import ResultActions, {
  type ResultActionsProps,
} from '@/components/game/ResultActions';
import Outcome from '@/components/game/run-summary/Outcome';
import Stats from '@/components/game/run-summary/Stats';
import SummarySkeleton from '@/components/game/run-summary/SummarySkeleton';
import { RAIL_SECTION } from '@/styles/classes';
import type { SoloEndView } from '@/types/canvas';

type Props = ResultActionsProps & {
  end: SoloEndView;
  onRevealMissed: () => void;
};

const RunSummary = ({
  end,
  onPlayAgain,
  onChangeFilters,
  onBackToPlay,
  capLine,
  onPlayDuel,
  isPicked,
  isPractice,
  onRevealMissed,
}: Props) => {
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
};

export default RunSummary;
