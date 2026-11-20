'use client';

import React from 'react';
import { DOT_BUTTON, DUEL_ACTOR_BG } from '@/styles/classes';
import type { DuelActor } from '@/types/duel';

const DOT_LABELS: Record<DuelActor, string> = {
  you: 'Show your lives',
  opponent: "Show opponent's lives",
};

type Props = {
  actor: DuelActor;
  isShown: boolean;
  isDisabled: boolean;
  isReconnecting: boolean;
  onShow: (actor: DuelActor) => void;
};

const Dot = ({ actor, isShown, isDisabled, isReconnecting, onShow }: Props) => {
  const tone = isDisabled
    ? 'border-fg-dim'
    : isReconnecting
      ? `border-line ${isShown ? 'bg-warning' : ''}`
      : `border-line ${isShown ? DUEL_ACTOR_BG[actor] : ''}`;

  return (
    <button
      type="button"
      className={DOT_BUTTON}
      aria-pressed={isShown}
      aria-label={DOT_LABELS[actor]}
      disabled={isDisabled}
      // A click must not pull focus from the guess
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onShow(actor)}
    >
      <span
        aria-hidden="true"
        className={`size-3 rounded-full border-2 ${tone}`}
      />
    </button>
  );
};

export default Dot;
