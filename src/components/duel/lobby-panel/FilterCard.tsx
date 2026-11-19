import React, { type ReactNode } from 'react';
import ActorBar from '@/components/duel/lobby-panel/ActorBar';
import { CARD } from '@/components/duel/lobby-panel/styles';
import type { DuelActor } from '@/types/duel';

type Props = {
  actor: DuelActor;
  title: string;
  children: ReactNode;
  footer: ReactNode;
};

const FilterCard = ({ actor, title, children, footer }: Props) => {
  return (
    <section aria-label={title} className={CARD}>
      <div className="flex flex-col gap-2">
        <ActorBar actor={actor} />
        <h3 className="truncate text-14 font-semibold text-fg">{title}</h3>
      </div>
      <div className="flex-1">{children}</div>
      {footer}
    </section>
  );
};

export default FilterCard;
