import React, { type RefObject } from 'react';
import { OUTCOME_BOX, OUTCOME_TITLE } from '@/components/game/styles';
import { Badge } from '@/components/ui/badge';
import { duelResultDetail, duelResultTitle } from '@/lib/duel-result';
import { cn } from '@/lib/utils';
import { DUEL_ACTOR_BG } from '@/styles/classes';
import type { DuelResult } from '@/types/duel';
import type { DuelOutcome } from '@/types/game';

// A win takes the block in your colour, edge to edge
const OUTCOME_TONES: Record<DuelOutcome, string> = {
  win: 'bg-you text-on-accent',
  forfeit_win: 'bg-you text-on-accent',
  loss: 'bg-surface-card text-fg',
  draw: 'bg-surface-card text-fg',
};

const TOP_BAND = 'absolute inset-x-0 top-0 flex h-1.5';

type Props = {
  result: DuelResult;
  isConnectionLost: boolean;
  titleId: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
};

const Outcome = ({ result, isConnectionLost, titleId, titleRef }: Props) => {
  const isWin = result.outcome === 'win' || result.outcome === 'forfeit_win';

  return (
    // No skeleton here, so a long title may grow it
    <div
      className={cn(
        OUTCOME_BOX,
        'h-auto min-h-24 py-3',
        OUTCOME_TONES[result.outcome],
      )}
    >
      {/* A draw carries both colours, neither leading */}
      {result.outcome === 'draw' ? (
        <span aria-hidden="true" className={TOP_BAND}>
          <span className={`flex-1 ${DUEL_ACTOR_BG.you}`} />
          <span className={`flex-1 ${DUEL_ACTOR_BG.opponent}`} />
        </span>
      ) : null}
      {result.outcome === 'loss' ? (
        <span aria-hidden="true" className={`${TOP_BAND} bg-danger`} />
      ) : null}
      <div className="flex min-w-0 flex-col gap-1">
        <h2 ref={titleRef} id={titleId} tabIndex={-1} className={OUTCOME_TITLE}>
          {duelResultTitle(result, { isConnectionLost })}
        </h2>
        <p className={`text-14 leading-5 ${isWin ? '' : 'text-fg-muted'}`}>
          {duelResultDetail(result, { isConnectionLost })}
        </p>
      </div>
      {result.isForfeit ? (
        <Badge variant="sticker" tone="neutral">
          Forfeit
        </Badge>
      ) : null}
    </div>
  );
};

export default Outcome;
