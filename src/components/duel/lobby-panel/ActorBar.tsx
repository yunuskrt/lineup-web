import React from 'react';
import { ACTOR_BAR, DUEL_ACTOR_BG } from '@/styles/classes';
import type { DuelActor } from '@/types/duel';

type Props = { actor: DuelActor };

const ActorBar = ({ actor }: Props) => {
  return (
    <span
      aria-hidden="true"
      className={`${ACTOR_BAR} ${DUEL_ACTOR_BG[actor]}`}
    />
  );
};

export default ActorBar;
