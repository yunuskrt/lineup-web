'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import CardFrame from '@/components/game/CardFrame';
import Dot from '@/components/game/duel-lives-card/Dot';
import ReconnectChip from '@/components/game/ReconnectChip';
import Tally from '@/components/game/Tally';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import {
  droppedLifeActor,
  type LivesByActor,
  shownLivesActor,
} from '@/lib/duel-status';
import { Badge } from '@/components/ui/badge';
import {
  MOTION_DURATION_MS,
  MOTION_EASING,
  MOTION_SECONDS,
} from '@/styles/motion';
import type { ConnectionState, DuelActor, DuelPlayer } from '@/types/duel';

const ACTORS: DuelActor[] = ['you', 'opponent'];

const ACTOR_LABELS: Record<DuelActor, string> = {
  you: 'You',
  opponent: 'Opponent',
};

const DUEL_HINT = 'Clock at 0 costs a life. 0 lives loses the duel.';

// The key restarts the timer on a repeat drop
type Hold = { actor: DuelActor; key: number };

// Presentation only: which player the card shows
function useShownActor(turn: DuelActor | null, lives: LivesByActor) {
  const [previousTurn, setPreviousTurn] = useState(turn);
  const [previousLives, setPreviousLives] = useState(lives);
  const [peek, setPeek] = useState<DuelActor | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);

  if (turn !== previousTurn) {
    setPreviousTurn(turn);
    setPeek(null);
  }

  if (
    lives.you !== previousLives.you ||
    lives.opponent !== previousLives.opponent
  ) {
    setPreviousLives(lives);
    const dropped = droppedLifeActor(previousLives, lives);
    // Stay on them while the pip empties
    if (dropped) setHold({ actor: dropped, key: (hold?.key ?? 0) + 1 });
  }

  useEffect(() => {
    if (!hold) return;
    const timer = setTimeout(() => setHold(null), MOTION_DURATION_MS.lifeLost);
    return () => clearTimeout(timer);
  }, [hold]);

  return { shown: shownLivesActor(peek, hold?.actor ?? null, turn), setPeek };
}

type Props = {
  you: DuelPlayer;
  // Null until pairing
  opponent: DuelPlayer | null;
  turn: DuelActor | null;
  opponentConnection?: ConnectionState | null;
};

const DuelLivesCard = ({
  you,
  opponent,
  turn,
  opponentConnection = null,
}: Props) => {
  const runs = useMotionPolicy();
  const players: Record<DuelActor, DuelPlayer | null> = { you, opponent };
  const { shown, setPeek } = useShownActor(turn, {
    you: you.lives,
    opponent: opponent?.lives ?? null,
  });
  const reconnectDeadline =
    opponentConnection?.status === 'reconnecting'
      ? opponentConnection.reconnectDeadline
      : null;

  return (
    <CardFrame
      hint={DUEL_HINT}
      chip={
        reconnectDeadline !== null ? (
          <ReconnectChip deadline={reconnectDeadline} />
        ) : null
      }
      footer={
        <div className="flex justify-center gap-1">
          {ACTORS.map((actor) => (
            <Dot
              key={actor}
              actor={actor}
              isShown={actor === shown}
              isDisabled={players[actor] === null}
              isReconnecting={
                actor === 'opponent' && reconnectDeadline !== null
              }
              onShow={setPeek}
            />
          ))}
        </div>
      }
    >
      {/* Both layers share one cell: same space either way */}
      <div className="grid">
        {ACTORS.map((actor) => {
          const player = players[actor];
          if (!player) return null;
          const isShown = actor === shown;

          return (
            <motion.div
              key={actor}
              inert={!isShown}
              className="col-start-1 row-start-1 flex min-w-0 flex-col gap-2"
              initial={false}
              animate={{ opacity: isShown ? 1 : 0 }}
              transition={{
                duration: runs('livesSwitch') ? MOTION_SECONDS.turnHandover : 0,
                ease: MOTION_EASING.turnHandover,
              }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Badge variant="sticker" tone={actor} tilt="none">
                  {ACTOR_LABELS[actor]}
                </Badge>
                <span className="min-w-0 truncate text-14 font-medium text-fg">
                  {player.handle}
                </span>
              </div>
              <Tally lives={player.lives} owner={actor} />
            </motion.div>
          );
        })}
      </div>
    </CardFrame>
  );
};

export default DuelLivesCard;
