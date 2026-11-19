'use client';

import React, { useState } from 'react';
import { motion, type Transition } from 'motion/react';
import Pitch from '@/components/pitch/Pitch';
import GridSlot from '@/components/pitch/squad-grid/GridSlot';
import { INSTANT } from '@/components/pitch/squad-grid/shared';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { parseFormation, slotLayout } from '@/lib/formation';
import { SKELETON_PULSE, SKELETON_PULSE_OPACITY } from '@/styles/motion';
import type { GridPulse } from '@/types/feedback';
import type { FoundPlayer, RevealedPlayer } from '@/types/player';

// Each width stays under slotLayout's line spacing
const SLOT_WIDTH_BY_WIDEST_LINE: Record<number, string> = {
  3: 'w-[24%]',
  4: 'w-[22%]',
  5: 'w-[18%]',
};

// Disc plus label stays under the row spacing
const DISC_BY_LINE_COUNT: Record<number, string> = {
  3: '[--disc:clamp(28px,12cqw,72px)]',
  4: '[--disc:clamp(20px,8cqw,56px)]',
  5: '[--disc:clamp(18px,6.5cqw,40px)]',
};

export function discSizeClass(formation: string): string {
  const lineCount = (parseFormation(formation) ?? []).length;
  if (lineCount <= 3) return DISC_BY_LINE_COUNT[3];
  return DISC_BY_LINE_COUNT[Math.min(lineCount, 5)];
}

const SETTLE: Transition = { duration: 0.2 };

export function slotWidthClass(formation: string): string {
  const widestLine = Math.max(...(parseFormation(formation) ?? []));
  if (widestLine <= 3) return SLOT_WIDTH_BY_WIDEST_LINE[3];
  return SLOT_WIDTH_BY_WIDEST_LINE[widestLine] ?? 'w-[14%]';
}

type Props = {
  formation: string;
  revealed: FoundPlayer[];
  // Pro only, and only once the player reveals
  missed?: RevealedPlayer[];
  pulse?: GridPulse;
  isLoading?: boolean;
};

const SquadGrid = ({
  formation,
  revealed,
  missed,
  pulse,
  isLoading = false,
}: Props) => {
  const runs = useMotionPolicy();
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
  const discClass = discSizeClass(formation);
  const playersBySlot = new Map(
    revealed.map((player) => [player.slot, player]),
  );
  const missedBySlot = new Map(
    (missed ?? []).map((player) => [player.slot, player]),
  );
  // Goalkeeper first: the order the slots appear in
  const missedRankBySlot = new Map(
    [...missedBySlot.keys()]
      .sort((a, b) => a - b)
      .map((slot, rank) => [slot, rank]),
  );
  const isRevealAnimated = runs('missedReveal');
  const isPulsing = isLoading && runs('skeletonPulse');

  return (
    <div className="flex size-full items-center justify-center @container-size">
      <div
        className={`relative aspect-[5/6] w-[min(100cqw,calc(100cqh*5/6))] overflow-clip @container ${discClass}`}
      >
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
                // Full-bleed so percent x/y resolve to the pitch
                <motion.li
                  key={point.slot}
                  initial={false}
                  animate={{ x: `${point.x}%`, y: `${point.y}%` }}
                  transition={runs('slotMove') ? undefined : INSTANT}
                  className="pointer-events-none absolute inset-0"
                >
                  {/* The point is the disc's foot: reveals never shift */}
                  <div
                    className={`pointer-events-auto absolute top-0 left-0 max-w-40 -translate-x-1/2 translate-y-[calc(var(--disc)*-1)] ${widthClass}`}
                  >
                    <GridSlot
                      position={point.position}
                      player={player}
                      missedPlayer={missedBySlot.get(point.slot)}
                      missedRank={
                        isRevealAnimated
                          ? (missedRankBySlot.get(point.slot) ?? 0)
                          : null
                      }
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
};

export default SquadGrid;
