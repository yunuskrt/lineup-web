'use client';

import React from 'react';
import { ACTIONS } from '@/components/duel/lobby-panel/styles';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/styles/classes';
import type { LobbyAction } from '@/types/duel-lobby';

type Props = {
  onAction: (action: LobbyAction) => void;
};

const RoomExpired = ({ onAction }: Props) => {
  return (
    <div className={ACTIONS}>
      <button
        type="button"
        className={PRIMARY_BUTTON}
        onClick={() => onAction('newRoom')}
      >
        Create a new room
      </button>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        onClick={() => onAction('cancel')}
      >
        Back to play
      </button>
    </div>
  );
};

export default RoomExpired;
