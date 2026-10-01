'use client';

import { motion } from 'motion/react';
import { type ReactNode, useEffect, useId, useState } from 'react';
import { Lives } from '@/components/game/Lives';
import { ReconnectChip } from '@/components/game/ReconnectChip';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import {
  droppedLifeActor,
  type LivesByActor,
  shownLivesActor,
} from '@/lib/duel-status';
import {
  DOT_BUTTON,
  DUEL_ACTOR_BG,
  DUEL_ACTOR_BORDER,
  DUEL_ACTOR_TEXT,
} from '@/styles/classes';
import {
  MOTION_DURATION_MS,
  MOTION_EASING,
  MOTION_SECONDS,
} from '@/styles/motion';
import type { ConnectionState, DuelActor, DuelPlayer } from '@/types/duel';
import type { Lives as LivesCount } from '@/types/game';

const ACTORS: DuelActor[] = ['you', 'opponent'];

const ACTOR_LABELS: Record<DuelActor, string> = {
  you: 'You',
  opponent: 'Opponent',
};

const DOT_LABELS: Record<DuelActor, string> = {
  you: 'Show your lives',
  opponent: "Show opponent's lives",
};

const SOLO_HINT = 'Clock at 0 costs a life. The run ends at 0 lives.';
const DUEL_HINT = 'Clock at 0 costs a life. 0 lives loses the duel.';

type CardFrameProps = {
  hint: string;
  chip?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

function CardFrame({ hint, chip, footer, children }: CardFrameProps) {
  const labelId = useId();

  return (
    <section
      aria-labelledby={labelId}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-card p-3 lg:p-4"
    >
      <div className="flex h-6 items-center justify-between gap-2">
        <span
          id={labelId}
          className="text-12 font-medium text-fg-muted uppercase"
        >
          Lives
        </span>
        {chip}
      </div>
      {children}
      {/* Hidden below lg to keep the band short */}
      <p className="hidden text-12 text-fg-muted lg:block">{hint}</p>
      {footer}
    </section>
  );
}

export function LivesCard({ lives }: { lives: LivesCount }) {
  return (
    <CardFrame hint={SOLO_HINT}>
      <Lives lives={lives} isTiled />
    </CardFrame>
  );
}

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

type DotProps = {
  actor: DuelActor;
  isShown: boolean;
  isDisabled: boolean;
  isReconnecting: boolean;
  onShow: (actor: DuelActor) => void;
};

function Dot({ actor, isShown, isDisabled, isReconnecting, onShow }: DotProps) {
  const tone = isDisabled
    ? 'border-fg-dim'
    : isReconnecting
      ? `border-warning ${isShown ? 'bg-warning' : ''}`
      : isShown
        ? `${DUEL_ACTOR_BORDER[actor]} ${DUEL_ACTOR_BG[actor]}`
        : 'border-fg-muted';

  return (
    <button
      type="button"
      className={DOT_BUTTON}
      aria-pressed={isShown}
      aria-label={DOT_LABELS[actor]}
      disabled={isDisabled}
      // A click must not pull focus from the guess
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onShow(actor)}
    >
      <span
        aria-hidden="true"
        className={`size-2.5 rounded-full border-2 ${tone}`}
      />
    </button>
  );
}

type DuelLivesCardProps = {
  you: DuelPlayer;
  // Null until pairing
  opponent: DuelPlayer | null;
  turn: DuelActor | null;
  opponentConnection?: ConnectionState | null;
};

export function DuelLivesCard({
  you,
  opponent,
  turn,
  opponentConnection = null,
}: DuelLivesCardProps) {
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
              <div className="flex min-w-0 items-baseline gap-2">
                <span
                  className={`text-12 font-semibold uppercase ${DUEL_ACTOR_TEXT[actor]}`}
                >
                  {ACTOR_LABELS[actor]}
                </span>
                <span className="min-w-0 truncate text-14 font-medium text-fg">
                  {player.handle}
                </span>
              </div>
              <Lives lives={player.lives} owner={actor} isTiled />
            </motion.div>
          );
        })}
      </div>
    </CardFrame>
  );
}
