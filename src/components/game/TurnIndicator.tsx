'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Lives } from '@/components/game/Lives';
import {
  DUEL_ACTOR_BG,
  DUEL_ACTOR_BORDER,
  DUEL_ACTOR_TEXT,
  TURN_BORDER_SHIFT,
} from '@/styles/classes';
import { MOTION_EASING, MOTION_SECONDS } from '@/styles/motion';
import type { DuelActor, DuelPlayer } from '@/types/duel';

const SIDES: Record<
  DuelActor,
  {
    label: string;
    turnLabel: string;
    // The chip enters from the side the turn came from
    chipFromX: number;
  }
> = {
  you: {
    label: 'You',
    turnLabel: 'Your turn',
    chipFromX: 8,
  },
  opponent: {
    label: 'Opponent',
    turnLabel: 'Their turn',
    chipFromX: -8,
  },
};

type PlayerPanelProps = {
  actor: DuelActor;
  player: DuelPlayer | null;
  isActive: boolean;
};

function PlayerPanel({ actor, player, isActive }: PlayerPanelProps) {
  const isReducedMotion = useReducedMotion();
  const side = SIDES[actor];
  const isOpponent = actor === 'opponent';

  return (
    <div
      className={`@container flex min-w-0 flex-col gap-2 rounded-md border-2 bg-surface-raised p-3 ${TURN_BORDER_SHIFT} ${
        isActive ? DUEL_ACTOR_BORDER[actor] : 'border-line'
      } ${isOpponent ? 'items-end text-right' : 'items-start'}`}
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
          {isActive && (
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
              {side.turnLabel}
            </motion.span>
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
};

export function TurnIndicator({ you, opponent, turn }: TurnIndicatorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <PlayerPanel actor="you" player={you} isActive={turn === 'you'} />
      <PlayerPanel
        actor="opponent"
        player={opponent}
        isActive={turn === 'opponent'}
      />
      <p className="sr-only" aria-live="polite">
        {turn ? SIDES[turn].turnLabel : ''}
      </p>
    </div>
  );
}
