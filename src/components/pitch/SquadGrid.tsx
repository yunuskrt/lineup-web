'use client';

import { motion } from 'motion/react';
import { Pitch } from '@/components/pitch/Pitch';
import { SquadSlot } from '@/components/pitch/SquadSlot';
import { parseFormation, slotLayout } from '@/lib/formation';
import type { RevealedPlayer } from '@/types/player';

// Each width stays under the line spacing slotLayout uses
const SLOT_WIDTH_BY_WIDEST_LINE: Record<number, string> = {
  3: 'w-[24%]',
  4: 'w-[22%]',
  5: 'w-[18%]',
};

export function slotWidthClass(formation: string): string {
  const widestLine = Math.max(...(parseFormation(formation) ?? []));
  if (widestLine <= 3) return SLOT_WIDTH_BY_WIDEST_LINE[3];
  return SLOT_WIDTH_BY_WIDEST_LINE[widestLine] ?? 'w-[14%]';
}

type SquadGridProps = {
  formation: string;
  revealed: RevealedPlayer[];
};

export function SquadGrid({ formation, revealed }: SquadGridProps) {
  const points = slotLayout(formation);
  const widthClass = slotWidthClass(formation);
  const playersBySlot = new Map(
    revealed.map((player) => [player.slot, player]),
  );

  return (
    <div className="flex size-full items-center justify-center @container-size">
      <div className="relative aspect-[5/6] w-[min(100cqw,calc(100cqh*5/6))] overflow-clip @container">
        <Pitch className="absolute inset-0 size-full" />
        {points ? (
          <ol aria-label="Starting XI">
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
                    {player ? (
                      <SquadSlot
                        state="filled"
                        position={point.position}
                        name={player.name}
                      />
                    ) : (
                      <SquadSlot state="empty" position={point.position} />
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        ) : (
          <p
            role="alert"
            className="absolute inset-0 flex items-center justify-center p-4 text-center text-14 text-fg-muted"
          >
            Couldn&apos;t lay out this formation
          </p>
        )}
      </div>
    </div>
  );
}
