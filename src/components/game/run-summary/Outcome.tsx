import React, { type RefObject } from 'react';
import Lives from '@/components/game/Lives';
import { OUTCOME_BOX, OUTCOME_TITLE } from '@/components/game/styles';
import { Badge } from '@/components/ui/badge';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import { pluralOf } from '@/lib/plural';
import { summaryTitle } from '@/lib/summary';
import { TYPE_NUMBER } from '@/styles/classes';
import type { SoloSummary } from '@/types/solo';

type Props = {
  summary: SoloSummary;
  titleId: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
};

const Outcome = ({ summary, titleId, titleRef }: Props) => {
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
};

export default Outcome;
