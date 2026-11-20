import React from 'react';
import Lives from '@/components/game/Lives';
import { foundTally } from '@/lib/duel-result';
import {
  ACTOR_BAR,
  DUEL_ACTOR_BG,
  RAIL_SECTION,
  TYPE_NUMBER,
} from '@/styles/classes';
import type { DuelActor, DuelResult } from '@/types/duel';

type Props = { result: DuelResult };

const Tally = ({ result }: Props) => {
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
};

export default Tally;
