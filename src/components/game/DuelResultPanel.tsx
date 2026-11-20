'use client';

import React, { useEffect, useId, useRef } from 'react';
import Outcome from '@/components/game/duel-result-panel/Outcome';
import Tally from '@/components/game/duel-result-panel/Tally';
import NamedOrder from '@/components/game/NamedOrder';
import ResultActions, {
  type ResultActionsProps,
} from '@/components/game/ResultActions';
import { RAIL_SECTION } from '@/styles/classes';
import type { DuelResult } from '@/types/duel';

type Props = ResultActionsProps & {
  result: DuelResult;
  // Your forfeit came from a dropped connection
  isConnectionLost?: boolean;
};

const DuelResultPanel = ({
  result,
  isConnectionLost = false,
  onPlayAgain,
  onChangeFilters,
  onBackToPlay,
  isPrivate,
  hostAccess,
}: Props) => {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Not Play again: a held Enter would start a duel
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // From lg the pitch sets the height; the list scrolls
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-1 flex-col gap-4 lg:min-h-0 lg:contain-size"
    >
      <Outcome
        result={result}
        isConnectionLost={isConnectionLost}
        titleId={titleId}
        titleRef={titleRef}
      />
      <Tally result={result} />
      <NamedOrder
        mode="duel"
        found={result.found}
        opponentHandle={result.opponent.handle}
      />
      <div
        className={`flex flex-col border-t-2 border-line pt-3 sm:pt-4 lg:mt-auto ${RAIL_SECTION}`}
      >
        <ResultActions
          onPlayAgain={onPlayAgain}
          onChangeFilters={onChangeFilters}
          onBackToPlay={onBackToPlay}
          isPrivate={isPrivate}
          hostAccess={hostAccess}
        />
      </div>
    </section>
  );
};

export default DuelResultPanel;
