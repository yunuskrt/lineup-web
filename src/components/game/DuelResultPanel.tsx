'use client';

import { type RefObject, useEffect, useId, useRef } from 'react';
import { Lives } from '@/components/game/Lives';
import { NamedOrder } from '@/components/game/NamedOrder';
import {
  ResultActions,
  type ResultActionsProps,
} from '@/components/game/ResultActions';
import { OUTCOME_BOX, OUTCOME_TITLE } from '@/components/game/RunSummary';
import { Badge } from '@/components/ui/badge';
import {
  duelResultDetail,
  duelResultTitle,
  foundTally,
} from '@/lib/duel-result';
import { cn } from '@/lib/utils';
import {
  ACTOR_BAR,
  DUEL_ACTOR_BG,
  RAIL_SECTION,
  TYPE_NUMBER,
} from '@/styles/classes';
import type { DuelActor, DuelResult } from '@/types/duel';
import type { DuelOutcome } from '@/types/game';

// A win takes the block in your colour, edge to edge
const OUTCOME_TONES: Record<DuelOutcome, string> = {
  win: 'bg-you text-on-accent',
  forfeit_win: 'bg-you text-on-accent',
  loss: 'bg-surface-card text-fg',
  draw: 'bg-surface-card text-fg',
};

const TOP_BAND = 'absolute inset-x-0 top-0 flex h-1.5';

type OutcomeProps = {
  result: DuelResult;
  isConnectionLost: boolean;
  titleId: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
};

function Outcome({
  result,
  isConnectionLost,
  titleId,
  titleRef,
}: OutcomeProps) {
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
}

function Tally({ result }: { result: DuelResult }) {
  const tally = foundTally(result.found);
  const sides: { actor: DuelActor; label: string; lives: number }[] = [
    { actor: 'you', label: 'You named', lives: result.you.lives },
    {
      actor: 'opponent',
      label: `${result.opponent.handle} named`,
      lives: result.opponent.lives,
    },
  ];

  return (
    <dl className={`grid grid-cols-2 border-b-2 border-line ${RAIL_SECTION}`}>
      {sides.map(({ actor, label, lives }) => (
        <div
          key={actor}
          className="flex min-w-0 flex-col gap-1.5 py-3 pr-3 first:border-r-2 first:border-line last:pl-4"
        >
          {/* The bar sits in the dt: a dl group holds dt/dd */}
          <dt className="flex min-w-0 flex-col gap-1.5 text-12 leading-4 font-medium text-fg-muted uppercase">
            <span
              aria-hidden="true"
              className={`${ACTOR_BAR} ${DUEL_ACTOR_BG[actor]}`}
            />
            <span className="truncate">{label}</span>
          </dt>
          <dd className={`text-28 leading-none ${TYPE_NUMBER}`}>
            {tally[actor]}
          </dd>
          <dd>
            <Lives lives={lives} owner={actor} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

type DuelResultPanelProps = ResultActionsProps & {
  result: DuelResult;
  // Your forfeit came from a dropped connection
  isConnectionLost?: boolean;
};

export function DuelResultPanel({
  result,
  isConnectionLost = false,
  onPlayAgain,
  onChangeFilters,
  isPrivate,
  hostAccess,
}: DuelResultPanelProps) {
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
          isPrivate={isPrivate}
          hostAccess={hostAccess}
        />
      </div>
    </section>
  );
}
