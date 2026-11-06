'use client';

import { motion, type Variants } from 'motion/react';
import { ClubCrest } from '@/components/game/ClubCrest';
import { CompetitionLogo } from '@/components/game/CompetitionLogo';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { matchDateLabel } from '@/lib/summary';
import { MOTION_SECONDS } from '@/styles/motion';
import { FOCUS_RING } from '@/styles/classes';
import type { CanvasSidePick } from '@/types/canvas';
import type { Side } from '@/types/match';

const ENTRANCE = {
  duration: MOTION_SECONDS.sidePickEntrance,
  ease: 'easeOut',
} as const;

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

type SidePickCardProps = {
  sidePick: CanvasSidePick;
  onPick: (side: Side) => void;
};

type TileProps = {
  sidePick: CanvasSidePick;
  side: Side;
  onPick: (side: Side) => void;
};

function Tile({ sidePick, side, onPick }: TileProps) {
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
      className={`flex min-w-0 flex-col items-center gap-2 rounded-md border border-line bg-surface-card px-2 py-3 text-center sm:px-3 sm:py-4 ${TILE_CELL[side]} ${FOCUS_RING} ${
        isChoosing ? 'cursor-default' : 'hover:border-brand'
      }`}
    >
      <motion.span variants={CREST_VARIANTS} className="flex">
        <ClubCrest club={club} size="card" />
      </motion.span>
      <span
        className={`line-clamp-2 w-full font-display text-14 leading-5 font-semibold wrap-break-word sm:text-16 ${
          isChoosing ? 'text-fg-muted' : 'text-fg'
        }`}
      >
        {club.name}
      </span>
    </motion.button>
  );
}

export function SidePickCard({ sidePick, onPick }: SidePickCardProps) {
  const runs = useMotionPolicy();
  const { match } = sidePick;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center justify-between gap-3 text-14 leading-5 text-fg-muted">
        <span className="flex min-w-0 items-center gap-1.5">
          <CompetitionLogo competition={match.competition} className="size-5" />
          <span className="min-w-0 truncate">{match.competition.name}</span>
        </span>
        <span className="shrink-0">{matchDateLabel(match.date)}</span>
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4">
        <Tile sidePick={sidePick} side="home" onPick={onPick} />
        <motion.p
          initial={runs('sidePickSlide') ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={ENTRANCE}
          className="col-span-2 row-start-1 flex items-baseline justify-center gap-1.5 self-center font-display text-24 leading-8 font-semibold text-fg tabular-nums sm:col-span-1 sm:col-start-2 sm:text-32 sm:leading-10"
        >
          <span>{match.score.home}</span>
          <span aria-hidden="true" className="text-fg-dim">
            –
          </span>
          <span className="sr-only">to</span>
          <span>{match.score.away}</span>
        </motion.p>
        <Tile sidePick={sidePick} side="away" onPick={onPick} />
      </div>
    </div>
  );
}
