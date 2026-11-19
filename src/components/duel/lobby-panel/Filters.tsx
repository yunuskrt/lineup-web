'use client';

import React from 'react';
import FilterCard from '@/components/duel/lobby-panel/FilterCard';
import LockedIn from '@/components/duel/lobby-panel/LockedIn';
import { STATUS_ROW } from '@/components/duel/lobby-panel/styles';
import SummaryList from '@/components/duel/lobby-panel/SummaryList';
import { PRIMARY_BUTTON } from '@/styles/classes';
import type { DuelPlayer } from '@/types/duel';
import type { DuelLobbyView, LobbyAction } from '@/types/duel-lobby';

type Props = {
  lobby: Extract<DuelLobbyView, { step: 'filters' }>;
  opponent: DuelPlayer | null;
  onAction: (action: LobbyAction) => void;
};

const Filters = ({ lobby, opponent, onAction }: Props) => {
  const isYoursLocked = lobby.submission.yours === 'submitted';
  const isTheirsLocked = lobby.submission.theirs === 'submitted';
  const theirName = opponent?.handle ?? 'Opponent';
  // Kept mounted so a screen reader hears each lock
  const lockStatus = [
    isYoursLocked ? 'Your filters are locked in.' : '',
    isTheirsLocked ? `${theirName} locked in.` : '',
  ].join(' ');

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <p role="status" className="sr-only">
        {lockStatus.trim()}
      </p>
      <FilterCard
        actor="you"
        title="Your filters"
        footer={
          isYoursLocked ? (
            <LockedIn actor="you" />
          ) : (
            <button
              type="button"
              disabled={lobby.isLocking}
              className={`h-8 w-full disabled:opacity-70 ${PRIMARY_BUTTON}`}
              onClick={() => onAction('lock')}
            >
              {lobby.isLocking ? 'Locking in…' : 'Lock in filters'}
            </button>
          )
        }
      >
        <SummaryList summary={lobby.yours} />
      </FilterCard>
      <FilterCard
        actor="opponent"
        title={`${theirName}'s filters`}
        footer={
          isTheirsLocked ? (
            <LockedIn actor="opponent" />
          ) : (
            <span className={`${STATUS_ROW} text-fg-muted`}>Choosing…</span>
          )
        }
      >
        <p className="text-14 text-fg-muted">Hidden until the coin flip.</p>
      </FilterCard>
    </div>
  );
};

export default Filters;
