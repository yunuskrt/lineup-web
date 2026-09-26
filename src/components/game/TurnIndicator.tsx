'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Lives } from '@/components/game/Lives';
import { TURN_BORDER_SHIFT } from '@/styles/classes';
import { MOTION_DURATION_MS, MOTION_EASING } from '@/styles/motion';
import type { DuelActor, DuelPlayer } from '@/types/duel';

const SIDES: Record<
  DuelActor,
  {
    label: string;
    turnLabel: string;
    border: string;
    text: string;
    chip: string;
    // The chip enters from the side the turn came from
    chipFromX: number;
  }
> = {
  you: {
    label: 'You',
    turnLabel: 'Your turn',
    border: 'border-you',
    text: 'text-you',
    chip: 'bg-you',
    chipFromX: 8,
  },
  opponent: {
    label: 'Opponent',
    turnLabel: 'Their turn',
    border: 'border-opponent',
    text: 'text-opponent',
    chip: 'bg-opponent',
    chipFromX: -8,
  },
};

type PlayerPanelProps = {
  actor: DuelActor;
  player: DuelPlayer;
  isActive: boolean;
};

function PlayerPanel({ actor, player, isActive }: PlayerPanelProps) {
  const isReducedMotion = useReducedMotion();
  const side = SIDES[actor];
  const isOpponent = actor === 'opponent';

  return (
    <div
      className={`@container flex min-w-0 flex-col gap-2 rounded-md border-2 bg-surface-raised p-3 ${TURN_BORDER_SHIFT} ${
        isActive ? side.border : 'border-line'
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
            isActive ? side.text : 'text-fg-muted'
          }`}
        >
          {side.label}
        </span>
        <span className="flex h-6 items-center">
          {isActive && (
            <motion.span
              aria-hidden="true"
              className={`rounded-sm px-2 py-0.5 text-12 font-semibold whitespace-nowrap uppercase text-on-accent ${side.chip}`}
              initial={{ opacity: 0, x: side.chipFromX }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: MOTION_DURATION_MS.turnHandover / 1000,
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
      <span
        className={`w-full truncate text-16 font-medium ${
          isActive ? 'text-fg' : 'text-fg-muted'
        }`}
      >
        {player.handle}
      </span>
      <Lives lives={player.lives} owner={actor} />
    </div>
  );
}

type TurnIndicatorProps = {
  you: DuelPlayer;
  opponent: DuelPlayer;
  turn: DuelActor;
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
        {SIDES[turn].turnLabel}
      </p>
    </div>
  );
}
