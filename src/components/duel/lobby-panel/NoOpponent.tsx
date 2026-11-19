'use client';

import React from 'react';
import { ACTIONS } from '@/components/duel/lobby-panel/styles';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/styles/classes';
import type { LobbyAction } from '@/types/duel-lobby';

type Props = { onAction: (action: LobbyAction) => void };

const NoOpponent = ({ onAction }: Props) => {
  return (
    <div className={ACTIONS}>
      <button
        type="button"
        className={PRIMARY_BUTTON}
        onClick={() => onAction('solo')}
      >
        Play solo with these filters
      </button>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        onClick={() => onAction('searchAgain')}
      >
        Search again
      </button>
    </div>
  );
};

export default NoOpponent;
