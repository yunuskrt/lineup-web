'use client';

import { type RefObject, useEffect, useId, useRef } from 'react';
import { Lives } from '@/components/game/Lives';
import {
  ResultActions,
  type ResultActionsProps,
} from '@/components/game/ResultActions';
import {
  duelResultDetail,
  duelResultTitle,
  foundTally,
} from '@/lib/duel-result';
import { DUEL_ACTOR_BG } from '@/styles/classes';
import type { DuelActor, DuelResult } from '@/types/duel';
import type { DuelOutcome } from '@/types/game';

// Same height as the solo outcome box
const OUTCOME_BOX =
  'relative flex h-24 items-center justify-between gap-4 overflow-hidden rounded-md border p-4';

const OUTCOME_TONES: Record<DuelOutcome, string> = {
  win: 'border-you bg-you text-on-accent',
  forfeit_win: 'border-you bg-you text-on-accent',
  loss: 'border-danger bg-surface-card text-fg',
  draw: 'border-line bg-surface-card text-fg',
};

type OutcomeProps = {
  result: DuelResult;
  titleId: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
};

function Outcome({ result, titleId, titleRef }: OutcomeProps) {
  const isWin = result.outcome === 'win' || result.outcome === 'forfeit_win';

  return (
    <div className={`${OUTCOME_BOX} ${OUTCOME_TONES[result.outcome]}`}>
      {/* A draw carries both colours, neither leading */}
      {result.outcome === 'draw' ? (
        <span aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1">
          <span className={`flex-1 ${DUEL_ACTOR_BG.you}`} />
          <span className={`flex-1 ${DUEL_ACTOR_BG.opponent}`} />
        </span>
      ) : null}
      <div className="flex min-w-0 flex-col">
        <h2
          ref={titleRef}
          id={titleId}
          tabIndex={-1}
          className="font-display text-32 leading-10 font-semibold outline-none"
        >
          {duelResultTitle(result)}
        </h2>
        <p className={`text-14 leading-5 ${isWin ? '' : 'text-fg-muted'}`}>
          {duelResultDetail(result)}
        </p>
      </div>
      {result.isForfeit ? (
        <span className="shrink-0 rounded-sm border border-current px-2 py-0.5 text-12 font-semibold">
          Forfeit
        </span>
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
    <dl className="grid grid-cols-2 gap-4">
      {sides.map(({ actor, label, lives }) => (
        <div key={actor} className="flex min-w-0 flex-col gap-1.5">
          {/* The bar sits in the dt: a dl group holds dt/dd */}
          <dt className="flex min-w-0 flex-col gap-1.5 text-12 leading-4 text-fg-muted">
            <span
              aria-hidden="true"
              className={`h-1 w-8 ${DUEL_ACTOR_BG[actor]}`}
            />
            <span className="truncate">{label}</span>
          </dt>
          <dd className="font-display text-32 leading-10 font-semibold tabular-nums">
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
};

export function DuelResultPanel({
  result,
  onPlayAgain,
  onChangeFilters,
}: DuelResultPanelProps) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Not Play again: a held Enter would start a duel
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <section aria-labelledby={titleId} className="flex flex-1 flex-col gap-6">
      <Outcome result={result} titleId={titleId} titleRef={titleRef} />
      <Tally result={result} />
      <ResultActions
        onPlayAgain={onPlayAgain}
        onChangeFilters={onChangeFilters}
      />
    </section>
  );
}
