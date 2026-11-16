'use client';

import { Check, Copy, Link, type LucideIcon, User, Users } from 'lucide-react';
import { motion, type Transition } from 'motion/react';
import { type ReactNode, useEffect, useState } from 'react';
import type { GateSize } from '@/components/game/CanvasGate';
import { Badge } from '@/components/ui/badge';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { roomClosesLabel, roomLink } from '@/lib/room-code';
import { cn } from '@/lib/utils';
import { serverClock } from '@/lib/server-clock';
import {
  ACTOR_BAR,
  CODE_BOX,
  DUEL_ACTOR_BG,
  DUEL_ACTOR_TEXT,
  ICON_TILE,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TYPE_ROOM_CODE,
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
  roomWaiting: 'wide',
  roomExpired: 'narrow',
  joining: 'narrow',
  paired: 'wide',
  filters: 'wide',
  coinFlip: 'wide',
  noOpponent: 'narrow',
};

const CARD =
  'relative flex flex-col gap-3 rounded-lg border-2 border-line bg-surface-card p-4 shadow-hard';

// Narrow gates: the main action first, stacked
const ACTIONS = 'flex w-full flex-col gap-3';

// Button height, so locking in doesn't shift the card
const STATUS_ROW = 'flex h-8 items-center gap-2 text-14 font-medium';

const AMBIENT_PULSE: Transition = {
  duration: MOTION_SECONDS.skeletonPulse,
  ease: MOTION_EASING.skeletonPulse,
  repeat: Infinity,
};

function ActorBar({ actor }: { actor: DuelActor }) {
  return (
    <span
      aria-hidden="true"
      className={`${ACTOR_BAR} ${DUEL_ACTOR_BG[actor]}`}
    />
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
  const runs = useMotionPolicy();
  const isPulsing = runs('lobbyPulse');

  return (
    <div className="flex flex-col items-center gap-5">
      <span
        aria-hidden="true"
        className={`size-12 bg-surface-card ${ICON_TILE}`}
      >
        <Users className="size-6" strokeWidth={2.25} />
      </span>
      {/* The opponent's mark waits, dim, to be filled */}
      <span aria-hidden="true" className="flex gap-1.5">
        <ActorBar actor="you" />
        <motion.span
          className={`${ACTOR_BAR} bg-fg-dim`}
          initial={false}
          animate={{
            opacity: isPulsing ? [...SKELETON_PULSE_OPACITY] : 1,
          }}
          transition={isPulsing ? AMBIENT_PULSE : undefined}
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

const ROOM_TICK_MS = 1_000;
const COPIED_MS = 2_000;

type CopyTarget = 'code' | 'link';

// "Copied" in place; a refused clipboard says so
function useCopy() {
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [isRefused, setIsRefused] = useState(false);

  useEffect(() => {
    if (copied === null) return;
    const timer = setTimeout(() => setCopied(null), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy(target: CopyTarget, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setIsRefused(false);
      setCopied(target);
    } catch {
      setIsRefused(true);
    }
  }

  return { copied, isRefused, copy };
}

// Counts to the server's deadline; decides nothing
function ClosesIn({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(() => serverClock.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(serverClock.now()), ROOM_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <p suppressHydrationWarning className="text-14 text-fg-muted tabular-nums">
      {roomClosesLabel(expiresAt - now)}
    </p>
  );
}

type RoomWaitingProps = {
  lobby: Extract<DuelLobbyView, { step: 'roomWaiting' }>;
  onAction: (action: LobbyAction) => void;
};

function CopyButton({
  label,
  isCopied,
  icon: Icon,
  onCopy,
}: {
  label: string;
  isCopied: boolean;
  icon: LucideIcon;
  onCopy: () => void;
}) {
  const Shown = isCopied ? Check : Icon;
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap ${SECONDARY_BUTTON}`}
      onClick={onCopy}
    >
      <Shown aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.5} />
      {isCopied ? 'Copied' : label}
    </button>
  );
}

function RoomWaiting({ lobby, onAction }: RoomWaitingProps) {
  const { copied, isRefused, copy } = useCopy();
  const { code } = lobby;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-line bg-surface-card p-4">
        {/* The code below names itself, letter by letter */}
        <span
          aria-hidden="true"
          className="text-12 font-medium text-fg-muted uppercase"
        >
          Room code
        </span>
        <p
          aria-label={`Room code ${code.split('').join(' ')}`}
          className="flex w-full max-w-84 justify-center select-all"
        >
          {code.split('').map((char, index) => (
            <span
              key={index}
              className={`aspect-square max-w-14 min-w-0 flex-1 text-20 sm:text-28 ${TYPE_ROOM_CODE} ${CODE_BOX}`}
            >
              {char}
            </span>
          ))}
        </p>
        <div className="grid w-full gap-3 min-[360px]:grid-cols-2">
          <CopyButton
            label="Copy code"
            icon={Copy}
            isCopied={copied === 'code'}
            onCopy={() => void copy('code', code)}
          />
          <CopyButton
            label="Copy link"
            icon={Link}
            isCopied={copied === 'link'}
            onCopy={() =>
              void copy('link', roomLink(window.location.origin, code))
            }
          />
        </div>
      </div>
      <p role="status" className="text-center text-14 text-fg-muted">
        {isRefused
          ? "Copying isn't allowed here. Select the code instead."
          : copied
            ? `${copied === 'code' ? 'Code' : 'Link'} copied.`
            : ''}
      </p>
      <SummaryList summary={lobby.filters} />
      <div className="flex items-center justify-between gap-4">
        <ClosesIn expiresAt={lobby.expiresAt} />
        <button
          type="button"
          className={SECONDARY_BUTTON}
          onClick={() => onAction('cancel')}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RoomExpired({
  onAction,
}: {
  onAction: (action: LobbyAction) => void;
}) {
  return (
    <div className={ACTIONS}>
      <button
        type="button"
        className={PRIMARY_BUTTON}
        onClick={() => onAction('newRoom')}
      >
        Create a new room
      </button>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        onClick={() => onAction('cancel')}
      >
        Back to play
      </button>
    </div>
  );
}

function PlayerCard({
  actor,
  player,
}: {
  actor: DuelActor;
  player: DuelPlayer;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-2 rounded-lg border-2 border-line p-4 text-center text-on-accent shadow-hard ${DUEL_ACTOR_BG[actor]}`}
    >
      <span
        aria-hidden="true"
        className={`size-10 bg-surface-card ${ICON_TILE}`}
      >
        <User className="size-5" strokeWidth={2.25} />
      </span>
      <span className="w-full truncate text-16 font-semibold">
        {player.handle}
      </span>
      <span className="text-12">{actor === 'you' ? 'You' : 'Opponent'}</span>
    </div>
  );
}

// Reading order on phones too: you, vs, opponent
function Paired({ you, opponent }: { you: DuelPlayer; opponent: DuelPlayer }) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <PlayerCard actor="you" player={you} />
      <span className="flex justify-center">
        <span className="sr-only">vs</span>
        <Badge
          aria-hidden="true"
          variant="sticker"
          tone="butter"
          className="px-3 py-1 text-20"
        >
          VS
        </Badge>
      </span>
      <PlayerCard actor="opponent" player={opponent} />
    </div>
  );
}

type FilterCardProps = {
  actor: DuelActor;
  title: string;
  children: ReactNode;
  footer: ReactNode;
};

function FilterCard({ actor, title, children, footer }: FilterCardProps) {
  return (
    <section aria-label={title} className={CARD}>
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
    <span className={STATUS_ROW}>
      <Badge variant="sticker" tone={actor} tilt="none">
        <Check strokeWidth={3} aria-hidden="true" />
        Locked in
      </Badge>
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
        footer={
          isYoursLocked ? (
            <LockedIn actor="you" />
          ) : (
            <button
              type="button"
              disabled={lobby.isLocking}
              className={`h-8 w-full disabled:opacity-70 ${PRIMARY_BUTTON}`}
              onClick={() => onAction('lock')}
            >
              {lobby.isLocking ? 'Locking in…' : 'Lock in filters'}
            </button>
          )
        }
      >
        <SummaryList summary={lobby.yours} />
      </FilterCard>
      <FilterCard
        actor="opponent"
        title={`${theirName}'s filters`}
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
}

function NoOpponent({ onAction }: { onAction: (action: LobbyAction) => void }) {
  return (
    <div className={ACTIONS}>
      <button
        type="button"
        className={PRIMARY_BUTTON}
        onClick={() => onAction('solo')}
      >
        Play solo with these filters
      </button>
      <button
        type="button"
        className={SECONDARY_BUTTON}
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
    case 'joining':
      return <Searching onAction={onAction} />;
    case 'roomWaiting':
      return <RoomWaiting lobby={lobby} onAction={onAction} />;
    case 'roomExpired':
      return <RoomExpired onAction={onAction} />;
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
