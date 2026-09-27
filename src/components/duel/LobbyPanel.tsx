'use client';

import { motion, type Transition, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import type { GateSize } from '@/components/game/CanvasGate';
import {
  DUEL_ACTOR_BG,
  DUEL_ACTOR_BORDER,
  DUEL_ACTOR_TEXT,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TEXT_LINK,
} from '@/styles/classes';
import {
  MOTION_EASING,
  MOTION_SECONDS,
  REVEAL_SPRING,
  SKELETON_PULSE_OPACITY,
} from '@/styles/motion';
import type { DuelActor, DuelPlayer } from '@/types/duel';
import type {
  DuelLobbyStep,
  DuelLobbyView,
  FilterSummary,
  LobbyAction,
} from '@/types/duel-lobby';

export const LOBBY_GATE_SIZE: Record<DuelLobbyStep, GateSize> = {
  searching: 'narrow',
  paired: 'wide',
  filters: 'wide',
  coinFlip: 'wide',
  noOpponent: 'narrow',
};

const CARD = 'flex flex-col gap-3 rounded-md border bg-surface-card p-4';

// Button height, so locking in doesn't shift the card
const STATUS_ROW = 'flex h-8 items-center gap-2 text-14 font-medium';

const AMBIENT_PULSE: Transition = {
  duration: MOTION_SECONDS.skeletonPulse,
  ease: MOTION_EASING.skeletonPulse,
  repeat: Infinity,
};

function ActorBar({ actor }: { actor: DuelActor }) {
  return (
    <span aria-hidden="true" className={`h-1 w-8 ${DUEL_ACTOR_BG[actor]}`} />
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-4 fill-none stroke-current stroke-3"
    >
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

function SummaryList({ summary }: { summary: FilterSummary }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-14">
      {summary.map((line) => (
        <div key={line.label} className="contents">
          <dt className="text-fg-muted">{line.label}</dt>
          <dd className="min-w-0 text-pretty text-fg">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Searching({ onAction }: { onAction: (action: LobbyAction) => void }) {
  const isReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-6">
      {/* The opponent's mark waits, dim, to be filled */}
      <span aria-hidden="true" className="flex gap-1.5">
        <ActorBar actor="you" />
        <motion.span
          className="h-1 w-8 bg-fg-dim"
          initial={false}
          animate={{
            opacity: isReducedMotion ? 1 : [...SKELETON_PULSE_OPACITY],
          }}
          transition={isReducedMotion ? undefined : AMBIENT_PULSE}
        />
      </span>
      <button
        type="button"
        className={`w-full ${SECONDARY_BUTTON}`}
        onClick={() => onAction('cancel')}
      >
        Cancel
      </button>
    </div>
  );
}

function Handle({ actor, player }: { actor: DuelActor; player: DuelPlayer }) {
  const isYou = actor === 'you';

  return (
    <div
      className={`flex min-w-0 flex-col gap-1.5 ${isYou ? 'items-start text-left' : 'items-end text-right'}`}
    >
      <ActorBar actor={actor} />
      <span
        className={`w-full truncate text-16 font-medium ${DUEL_ACTOR_TEXT[actor]}`}
      >
        {player.handle}
      </span>
      <span className="text-12 text-fg-muted">
        {isYou ? 'You' : 'Opponent'}
      </span>
    </div>
  );
}

function Paired({ you, opponent }: { you: DuelPlayer; opponent: DuelPlayer }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <Handle actor="you" player={you} />
      <span className="text-14 text-fg-dim">vs</span>
      <Handle actor="opponent" player={opponent} />
    </div>
  );
}

type FilterCardProps = {
  actor: DuelActor;
  title: string;
  isLocked: boolean;
  children: ReactNode;
  footer: ReactNode;
};

function FilterCard({
  actor,
  title,
  isLocked,
  children,
  footer,
}: FilterCardProps) {
  return (
    <section
      aria-label={title}
      className={`${CARD} ${isLocked ? DUEL_ACTOR_BORDER[actor] : 'border-line'}`}
    >
      <div className="flex flex-col gap-2">
        <ActorBar actor={actor} />
        <h3 className="truncate text-14 font-semibold text-fg">{title}</h3>
      </div>
      <div className="flex-1">{children}</div>
      {footer}
    </section>
  );
}

function LockedIn({ actor }: { actor: DuelActor }) {
  return (
    <span className={`${STATUS_ROW} ${DUEL_ACTOR_TEXT[actor]}`}>
      <CheckIcon />
      Locked in
    </span>
  );
}

type FiltersProps = {
  lobby: Extract<DuelLobbyView, { step: 'filters' }>;
  opponent: DuelPlayer | null;
  onAction: (action: LobbyAction) => void;
};

function Filters({ lobby, opponent, onAction }: FiltersProps) {
  const isYoursLocked = lobby.submission.yours === 'submitted';
  const isTheirsLocked = lobby.submission.theirs === 'submitted';
  const theirName = opponent?.handle ?? 'Opponent';
  // Kept mounted so a screen reader hears each lock
  const lockStatus = [
    isYoursLocked ? 'Your filters are locked in.' : '',
    isTheirsLocked ? `${theirName} locked in.` : '',
  ].join(' ');

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <p role="status" className="sr-only">
        {lockStatus.trim()}
      </p>
      <FilterCard
        actor="you"
        title="Your filters"
        isLocked={isYoursLocked}
        footer={
          isYoursLocked ? (
            <LockedIn actor="you" />
          ) : (
            <button
              type="button"
              className={`h-8 w-full ${PRIMARY_BUTTON}`}
              onClick={() => onAction('lock')}
            >
              Lock in filters
            </button>
          )
        }
      >
        <SummaryList summary={lobby.yours} />
      </FilterCard>
      <FilterCard
        actor="opponent"
        title={`${theirName}'s filters`}
        isLocked={isTheirsLocked}
        footer={
          isTheirsLocked ? (
            <LockedIn actor="opponent" />
          ) : (
            <span className={`${STATUS_ROW} text-fg-muted`}>Choosing…</span>
          )
        }
      >
        <p className="text-14 text-fg-muted">Hidden until the coin flip.</p>
      </FilterCard>
    </div>
  );
}

function CoinFlip({
  lobby,
}: {
  lobby: Extract<DuelLobbyView, { step: 'coinFlip' }>;
}) {
  const isReducedMotion = useReducedMotion();
  const { winner } = lobby;
  const title =
    winner === 'you' ? 'Your filters' : `${lobby.opponent.handle}'s filters`;

  return (
    <motion.section
      aria-label={title}
      className={`${CARD} border-2 ${DUEL_ACTOR_BORDER[winner]}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        ...REVEAL_SPRING,
        // Branching `initial` instead would break hydration
        scale: isReducedMotion ? { duration: 0 } : undefined,
      }}
    >
      {/* Both marks stay; the winner's leads */}
      <span aria-hidden="true" className="flex items-center gap-1.5">
        {(['you', 'opponent'] as const).map((actor) => (
          <span
            key={actor}
            className={`h-1 ${DUEL_ACTOR_BG[actor]} ${
              actor === winner ? 'w-16' : 'w-8 opacity-40'
            }`}
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
}

function NoOpponent({ onAction }: { onAction: (action: LobbyAction) => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        className={`w-full ${PRIMARY_BUTTON}`}
        onClick={() => onAction('solo')}
      >
        Play solo with these filters
      </button>
      <button
        type="button"
        className={`text-14 ${TEXT_LINK}`}
        onClick={() => onAction('searchAgain')}
      >
        Search again
      </button>
    </div>
  );
}

type LobbyPanelProps = {
  lobby: DuelLobbyView;
  you: DuelPlayer;
  opponent: DuelPlayer | null;
  onAction: (action: LobbyAction) => void;
};

export function LobbyPanel({
  lobby,
  you,
  opponent,
  onAction,
}: LobbyPanelProps) {
  switch (lobby.step) {
    case 'searching':
      return <Searching onAction={onAction} />;
    case 'paired':
      return <Paired you={you} opponent={lobby.opponent} />;
    case 'filters':
      return <Filters lobby={lobby} opponent={opponent} onAction={onAction} />;
    case 'coinFlip':
      return <CoinFlip lobby={lobby} />;
    case 'noOpponent':
      return <NoOpponent onAction={onAction} />;
  }
}
