'use client';

import React from 'react';
import { motion, type Variants } from 'motion/react';
import ClubCrest from '@/components/game/ClubCrest';
import { ENTRANCE } from '@/components/game/side-pick-card/shared';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { cn } from '@/lib/utils';
import { CHOICE_TILE, TYPE_CARD_TITLE } from '@/styles/classes';
import type { CanvasSidePick } from '@/types/canvas';
import type { Side } from '@/types/match';

const SLIDE_PX = 24;
const LIFT_PX = 2;

// Each tile slides in from its own side
const TILE_ENTER: Record<Side, number> = { home: -SLIDE_PX, away: SLIDE_PX };

// Phones: score on its own row, tiles get the width
const TILE_CELL: Record<Side, string> = {
  home: 'row-start-2 sm:col-start-1 sm:row-start-1',
  away: 'row-start-2 sm:col-start-3 sm:row-start-1',
};

const CREST_VARIANTS: Variants = {
  rest: { y: 0 },
  hover: { y: -LIFT_PX },
};

type Props = {
  sidePick: CanvasSidePick;
  side: Side;
  onPick: (side: Side) => void;
};

const Tile = ({ sidePick, side, onPick }: Props) => {
  const runs = useMotionPolicy();
  const { match, isChoosing } = sidePick;
  const club = match[side];
  const tileVariants: Variants = {
    enter: { opacity: 0, x: TILE_ENTER[side] },
    rest: { opacity: 1, x: 0, transition: ENTRANCE },
    hover: {},
  };
  const canLift = runs('sidePickHoverLift') && !isChoosing;

  return (
    <motion.button
      type="button"
      aria-label={`Name ${club.name}'s starting XI, ${side} side`}
      aria-disabled={isChoosing || undefined}
      onClick={() => {
        if (!isChoosing) onPick(side);
      }}
      variants={tileVariants}
      initial={runs('sidePickSlide') ? 'enter' : false}
      animate="rest"
      whileHover={canLift ? 'hover' : undefined}
      className={`flex min-w-0 flex-col items-center gap-3 px-2 py-4 text-center sm:px-3 sm:py-5 ${TILE_CELL[side]} ${CHOICE_TILE} ${
        isChoosing ? 'cursor-default' : 'hover:bg-surface-raised'
      }`}
    >
      {/* The crest sits in a round ink frame, as 12-pick-side-a */}
      <motion.span
        variants={CREST_VARIANTS}
        className="flex size-24 items-center justify-center rounded-full border-2 border-line bg-surface-card sm:size-28"
      >
        <ClubCrest club={club} size="card" />
      </motion.span>
      <span
        className={cn(
          TYPE_CARD_TITLE,
          'line-clamp-2 w-full text-16 wrap-break-word sm:text-20',
          isChoosing ? 'text-fg-muted' : 'text-fg',
        )}
      >
        {club.name}
      </span>
    </motion.button>
  );
};

export default Tile;
