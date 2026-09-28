'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Lives } from '@/components/game/Lives';
import {
  reconnectSecondsLeft,
  TURN_LABELS,
  turnAnnouncement,
} from '@/lib/duel-status';
import {
  DUEL_ACTOR_BG,
  DUEL_ACTOR_BORDER,
  DUEL_ACTOR_TEXT,
  TURN_BORDER_SHIFT,
} from '@/styles/classes';
import { MOTION_EASING, MOTION_SECONDS } from '@/styles/motion';
import type { ConnectionState, DuelActor, DuelPlayer } from '@/types/duel';

const RECONNECT_TICK_MS = 250;

const SIDES: Record<
  DuelActor,
  {
    label: string;
    // The chip enters from the side the turn came from
    chipFromX: number;
  }
> = {
  you: {
    label: 'You',
    chipFromX: 8,
  },
  opponent: {
    label: 'Opponent',
    chipFromX: -8,
  },
};

// Ticks from the server deadline; decides nothing
function ReconnectChip({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), RECONNECT_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="rounded-sm bg-warning px-2 py-0.5 text-12 font-semibold whitespace-nowrap text-on-accent">
      {/* Server and client clocks may differ by a tick */}
      <span suppressHydrationWarning>
        Reconnecting, {reconnectSecondsLeft(deadline, now)}s
      </span>
    </span>
  );
}

type PlayerPanelProps = {
  actor: DuelActor;
  player: DuelPlayer | null;
  isActive: boolean;
  reconnectDeadline?: number | null;
};

function PlayerPanel({
  actor,
  player,
  isActive,
  reconnectDeadline = null,
}: PlayerPanelProps) {
  const isReducedMotion = useReducedMotion();
  const side = SIDES[actor];
  const isOpponent = actor === 'opponent';
  const isReconnecting = reconnectDeadline !== null;
  const border = isReconnecting
    ? 'border-warning'
    : isActive
      ? DUEL_ACTOR_BORDER[actor]
      : 'border-line';

  return (
    <div
      className={`@container flex min-w-0 flex-col gap-2 rounded-md border-2 bg-surface-raised p-3 ${TURN_BORDER_SHIFT} ${border} ${
        isOpponent ? 'items-end text-right' : 'items-start'
      }`}
    >
      {/* Narrow panels stack the chip in a reserved row */}
      <div
        className={`flex w-full flex-col gap-1 @min-[14rem]:flex-row @min-[14rem]:items-center @min-[14rem]:justify-between @min-[14rem]:gap-2 ${
          isOpponent ? 'items-end @min-[14rem]:flex-row-reverse' : 'items-start'
        }`}
      >
        <span
          className={`text-12 leading-6 font-semibold uppercase ${
            isActive ? DUEL_ACTOR_TEXT[actor] : 'text-fg-muted'
          }`}
        >
          {side.label}
        </span>
        <span className="flex h-6 items-center">
          {isReconnecting ? (
            <ReconnectChip deadline={reconnectDeadline} />
          ) : (
            isActive && (
              <motion.span
                aria-hidden="true"
                className={`rounded-sm px-2 py-0.5 text-12 font-semibold whitespace-nowrap uppercase text-on-accent ${DUEL_ACTOR_BG[actor]}`}
                initial={{ opacity: 0, x: side.chipFromX }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: MOTION_SECONDS.turnHandover,
                  ease: MOTION_EASING.turnHandover,
                  // Branching `initial` instead would break hydration
                  x: isReducedMotion ? { duration: 0 } : undefined,
                }}
              >
                {TURN_LABELS[actor]}
              </motion.span>
            )
          )}
        </span>
      </div>
      {player ? (
        <>
          <span
            className={`w-full truncate text-16 font-medium ${
              isActive ? 'text-fg' : 'text-fg-muted'
            }`}
          >
            {player.handle}
          </span>
          <Lives lives={player.lives} owner={actor} />
        </>
      ) : (
        <>
          {/* Same boxes as the handle and pips */}
          <span className="flex h-6 w-full items-center justify-end">
            <span className="h-4 w-24 rounded-sm bg-skeleton-fill" />
            <span className="sr-only">Waiting for an opponent</span>
          </span>
          <div aria-hidden="true">
            <Lives lives={0} owner={actor} />
          </div>
        </>
      )}
    </div>
  );
}

type TurnIndicatorProps = {
  you: DuelPlayer;
  opponent: DuelPlayer | null;
  turn: DuelActor | null;
  opponentConnection?: ConnectionState | null;
};

export function TurnIndicator({
  you,
  opponent,
  turn,
  opponentConnection = null,
}: TurnIndicatorProps) {
  const reconnectDeadline =
    opponentConnection?.status === 'reconnecting'
      ? opponentConnection.reconnectDeadline
      : null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <PlayerPanel actor="you" player={you} isActive={turn === 'you'} />
      <PlayerPanel
        actor="opponent"
        player={opponent}
        isActive={turn === 'opponent'}
        reconnectDeadline={reconnectDeadline}
      />
      <p className="sr-only" aria-live="polite">
        {turnAnnouncement(turn, reconnectDeadline !== null)}
      </p>
    </div>
  );
}
