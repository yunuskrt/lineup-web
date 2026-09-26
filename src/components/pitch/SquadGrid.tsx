'use client';

import { motion, type Transition, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Pitch } from '@/components/pitch/Pitch';
import { RevealCard } from '@/components/pitch/RevealCard';
import { SquadSlot } from '@/components/pitch/SquadSlot';
import { parseFormation, slotLayout } from '@/lib/formation';
import {
  MOTION_DURATION_MS,
  MOTION_EASING,
  SKELETON_PULSE_OPACITY,
} from '@/styles/motion';
import type { GridPulse } from '@/types/feedback';
import type { FoundPlayer, PositionGroup } from '@/types/player';

// Each width stays under the line spacing slotLayout uses
const SLOT_WIDTH_BY_WIDEST_LINE: Record<number, string> = {
  3: 'w-[24%]',
  4: 'w-[22%]',
  5: 'w-[18%]',
};

const SKELETON_PULSE: Transition = {
  duration: MOTION_DURATION_MS.skeletonPulse / 1000,
  ease: MOTION_EASING.skeletonPulse,
  repeat: Infinity,
};

const SETTLE: Transition = { duration: 0.2 };

export function slotWidthClass(formation: string): string {
  const widestLine = Math.max(...(parseFormation(formation) ?? []));
  if (widestLine <= 3) return SLOT_WIDTH_BY_WIDEST_LINE[3];
  return SLOT_WIDTH_BY_WIDEST_LINE[widestLine] ?? 'w-[14%]';
}

type GridSlotProps = {
  position: PositionGroup;
  player: FoundPlayer | undefined;
  isLoading: boolean;
  isNew: boolean;
  pulseKey: number | undefined;
};

function GridSlot({
  position,
  player,
  isLoading,
  isNew,
  pulseKey,
}: GridSlotProps) {
  if (isLoading) return <SquadSlot state="loading" position={position} />;
  if (!player) return <SquadSlot state="empty" position={position} />;

  return (
    <RevealCard
      player={player}
      position={position}
      isNew={isNew}
      pulseKey={pulseKey}
    />
  );
}

type SquadGridProps = {
  formation: string;
  revealed: FoundPlayer[];
  pulse?: GridPulse;
  isLoading?: boolean;
};

export function SquadGrid({
  formation,
  revealed,
  pulse,
  isLoading = false,
}: SquadGridProps) {
  const isReducedMotion = useReducedMotion();
  const [previousRevealed, setPreviousRevealed] = useState(revealed);
  const [wasLoading, setWasLoading] = useState(isLoading);
  const [newIds, setNewIds] = useState<ReadonlySet<string>>(() => new Set());

  if (revealed !== previousRevealed || isLoading !== wasLoading) {
    const knownIds = new Set(previousRevealed.map((player) => player.id));
    // Whatever is there as loading ends is a snapshot
    const isSnapshot = isLoading || wasLoading;
    setPreviousRevealed(revealed);
    setWasLoading(isLoading);
    setNewIds(
      isSnapshot
        ? new Set()
        : new Set(
            revealed
              .filter((player) => !knownIds.has(player.id))
              .map((player) => player.id),
          ),
    );
  }

  const points = slotLayout(formation);
  const widthClass = slotWidthClass(formation);
  const playersBySlot = new Map(
    revealed.map((player) => [player.slot, player]),
  );
  const isPulsing = isLoading && !isReducedMotion;

  return (
    <div className="flex size-full items-center justify-center @container-size">
      <div className="relative aspect-[5/6] w-[min(100cqw,calc(100cqh*5/6))] overflow-clip @container">
        <Pitch className="absolute inset-0 size-full" />
        {points ? (
          <motion.ol
            aria-label="Starting XI"
            aria-busy={isLoading}
            initial={false}
            animate={{
              opacity: isPulsing ? [...SKELETON_PULSE_OPACITY] : 1,
            }}
            transition={isPulsing ? SKELETON_PULSE : SETTLE}
          >
            {points.map((point) => {
              const player = playersBySlot.get(point.slot);

              return (
                // Full-bleed layer so percent x/y resolve against the pitch
                <motion.li
                  key={point.slot}
                  initial={false}
                  animate={{ x: `${point.x}%`, y: `${point.y}%` }}
                  className="pointer-events-none absolute inset-0"
                >
                  <div
                    className={`pointer-events-auto absolute top-0 left-0 max-w-40 -translate-x-1/2 -translate-y-1/2 ${widthClass}`}
                  >
                    <GridSlot
                      position={point.position}
                      player={player}
                      isLoading={isLoading}
                      isNew={player !== undefined && newIds.has(player.id)}
                      pulseKey={
                        player !== undefined && pulse?.playerId === player.id
                          ? pulse.key
                          : undefined
                      }
                    />
                  </div>
                </motion.li>
              );
            })}
          </motion.ol>
        ) : (
          <p
            role="alert"
            className="absolute inset-0 flex items-center justify-center p-4 text-center text-14 text-fg-muted"
          >
            Couldn&apos;t lay out this formation
          </p>
        )}
        {isLoading ? <p className="sr-only">Loading squad</p> : null}
      </div>
    </div>
  );
}
