'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CARD } from '@/components/duel/lobby-panel/styles';
import SummaryList from '@/components/duel/lobby-panel/SummaryList';
import { Badge } from '@/components/ui/badge';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { cn } from '@/lib/utils';
import { ACTOR_BAR, DUEL_ACTOR_BG, DUEL_ACTOR_TEXT } from '@/styles/classes';
import { REVEAL_SPRING } from '@/styles/motion';
import type { DuelLobbyView } from '@/types/duel-lobby';

type Props = {
  lobby: Extract<DuelLobbyView, { step: 'coinFlip' }>;
};

const CoinFlip = ({ lobby }: Props) => {
  const runs = useMotionPolicy();
  const { winner } = lobby;
  const title =
    winner === 'you' ? 'Your filters' : `${lobby.opponent.handle}'s filters`;

  return (
    <motion.section
      aria-label={title}
      className={CARD}
      initial={{ opacity: 0, scale: runs('coinFlipScale') ? 0.96 : 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        ...REVEAL_SPRING,
        // Snaps a card that hydrated at its start
        scale: runs('coinFlipScale') ? undefined : { duration: 0 },
      }}
    >
      <Badge
        variant="sticker"
        tone={winner}
        tilt="right"
        className="absolute -top-3 right-4"
      >
        Used
      </Badge>
      {/* Both marks stay; the winner's leads */}
      <span aria-hidden="true" className="flex items-center gap-1.5">
        {(['you', 'opponent'] as const).map((actor) => (
          <span
            key={actor}
            className={cn(
              ACTOR_BAR,
              DUEL_ACTOR_BG[actor],
              actor === winner ? 'w-16' : 'opacity-40',
            )}
          />
        ))}
      </span>
      <h3
        className={`truncate text-14 font-semibold ${DUEL_ACTOR_TEXT[winner]}`}
      >
        {title}
      </h3>
      <SummaryList summary={lobby.applied} />
    </motion.section>
  );
};

export default CoinFlip;
