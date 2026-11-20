'use client';

import React from 'react';
import { motion } from 'motion/react';
import CompetitionLogo from '@/components/game/CompetitionLogo';
import { ENTRANCE } from '@/components/game/side-pick-card/shared';
import Tile from '@/components/game/side-pick-card/Tile';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { matchDateLabel } from '@/lib/summary';
import { TYPE_NUMBER } from '@/styles/classes';
import type { CanvasSidePick } from '@/types/canvas';
import type { Side } from '@/types/match';

type Props = {
  sidePick: CanvasSidePick;
  onPick: (side: Side) => void;
};

const SidePickCard = ({ sidePick, onPick }: Props) => {
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
          className={`col-span-2 row-start-1 flex items-baseline justify-center gap-1.5 self-center text-30 leading-9 text-fg sm:col-span-1 sm:col-start-2 sm:text-40 sm:leading-12 ${TYPE_NUMBER}`}
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
};

export default SidePickCard;
