'use client';

import { CircleAlert, WifiOff } from 'lucide-react';
import Link from 'next/link';
import {
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LOBBY_GATE_SIZE, LobbyPanel } from '@/components/duel/LobbyPanel';
import { CanvasGate, type GateSize } from '@/components/game/CanvasGate';
import { CountdownRing } from '@/components/game/CountdownRing';
import { DuelResultPanel } from '@/components/game/DuelResultPanel';
import { FeedbackToast } from '@/components/game/FeedbackToast';
import { FoundCount } from '@/components/game/FoundCount';
import { GuessInput } from '@/components/game/GuessInput';
import { LifeLostFlash } from '@/components/game/LifeLostFlash';
import { DuelLivesCard, LivesCard } from '@/components/game/LivesCard';
import { MatchHeader } from '@/components/game/MatchHeader';
import { PracticeCard } from '@/components/game/PracticeCard';
import { RunSummary } from '@/components/game/RunSummary';
import { SidePickCard } from '@/components/game/SidePickCard';
import { SoundToggle } from '@/components/game/SoundToggle';
import SquadGrid from '@/components/pitch/SquadGrid';
import { useGameSounds } from '@/hooks/use-game-sounds';
import QuitChip from '@/components/shell/QuitChip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { activeRing, clockLabel } from '@/lib/canvas';
import {
  reconnectSecondsLeft,
  turnAnnouncement,
  waitingLine,
} from '@/lib/duel-status';
import { LOADING_FORMATION } from '@/lib/formation';
import { PRO_PATH } from '@/lib/pro';
import { serverClock } from '@/lib/server-clock';
import {
  suggest,
  type Suggestion,
  type SuggestionIndex,
} from '@/lib/suggestions';
import { missedOnPitch } from '@/lib/summary';
import {
  ICON_TILE,
  PRIMARY_BUTTON,
  RAIL_SECTION,
  SECONDARY_BUTTON,
  TEXT_LINK,
  TYPE_NUMBER,
} from '@/styles/classes';
import type {
  CanvasGateCountdown,
  CanvasGateView,
  CanvasView,
} from '@/types/canvas';
import type { LobbyAction } from '@/types/duel-lobby';

const HEADINGS: Record<CanvasView['mode'], string> = {
  solo: 'Solo game',
  duel: 'Duel',
};

function ClockBlock({ view }: { view: CanvasView }) {
  const turn = view.mode === 'duel' ? view.turn : null;
  const ring = activeRing(view.clock, view.mode === 'duel' ? turn : 'you');
  const label = clockLabel(view.mode, turn);

  return (
    <div className="flex shrink-0 flex-col items-center gap-2 lg:-mx-4 lg:border-b-2 lg:border-line lg:px-4 lg:pb-4">
      {/* The duel sticker is the turn cue; keep it */}
      {label.actor ? (
        <span className="flex h-6 items-center">
          <Badge variant="sticker" tone={label.actor}>
            {label.text}
          </Badge>
        </span>
      ) : (
        <span
          className={`text-12 leading-6 font-medium text-fg-muted uppercase ${
            view.mode === 'solo' ? 'max-lg:hidden' : ''
          }`}
        >
          {label.text}
        </span>
      )}
      <CountdownRing round={ring.round} mode={ring.mode} owner={ring.owner} />
    </div>
  );
}

function RailLives({ view }: { view: CanvasView }) {
  if (view.mode === 'solo') return <LivesCard lives={view.lives} />;

  return (
    <DuelLivesCard
      you={view.you}
      opponent={view.opponent}
      turn={view.turn}
      opponentConnection={view.opponentConnection}
    />
  );
}

const COUNTDOWN_TICK_MS = 250;

function readClock(clock: CanvasGateCountdown['clock']): number {
  return clock === 'local' ? Date.now() : serverClock.now();
}

// Seconds left to the deadline; decides nothing
function useSecondsLeft(countdown: CanvasGateCountdown): number {
  const { clock } = countdown;
  const [now, setNow] = useState(() => readClock(clock));

  useEffect(() => {
    const timer = setInterval(
      () => setNow(readClock(clock)),
      COUNTDOWN_TICK_MS,
    );
    return () => clearInterval(timer);
  }, [clock]);

  return reconnectSecondsLeft(countdown.deadline, now);
}

function GateCountdown({ countdown }: { countdown: CanvasGateCountdown }) {
  const secondsLeft = useSecondsLeft(countdown);

  return (
    // Server and client clocks may differ by a tick
    <span suppressHydrationWarning>{countdown.label(secondsLeft)}</span>
  );
}

// The same deadline, big; the sentence says it too
function GateSeconds({ countdown }: { countdown: CanvasGateCountdown }) {
  const secondsLeft = useSecondsLeft(countdown);

  return (
    <p
      aria-hidden="true"
      suppressHydrationWarning
      className={`text-center text-48 leading-none ${TYPE_NUMBER}`}
    >
      {secondsLeft}s
    </p>
  );
}

// A gate's notice: an icon, or the detail as an Alert
function noticeParts(gate: CanvasGateView | null): {
  icon?: ReactNode;
  detail?: ReactNode;
  body?: ReactNode;
} {
  if (gate?.notice === 'refused') {
    return {
      body: gate.detail ? (
        <Alert>
          <CircleAlert aria-hidden="true" strokeWidth={2.5} />
          <AlertDescription>{gate.detail}</AlertDescription>
        </Alert>
      ) : undefined,
    };
  }
  const detail = gate?.countdown ? (
    <GateCountdown countdown={gate.countdown} />
  ) : (
    gate?.detail
  );
  if (gate?.notice !== 'connection') return { detail };
  return {
    icon: (
      <span
        aria-hidden="true"
        className={`size-12 bg-surface-card ${ICON_TILE}`}
      >
        <WifiOff className="size-6" strokeWidth={2.25} />
      </span>
    ),
    detail,
    body: gate.countdown ? (
      <GateSeconds countdown={gate.countdown} />
    ) : undefined,
  };
}

type GateActionProps = {
  gate: CanvasGateView;
  onGateAction: () => void;
  onGateSecondaryAction: () => void;
};

function GateAction({
  gate,
  onGateAction,
  onGateSecondaryAction,
}: GateActionProps) {
  if (gate.secondaryActionLabel || gate.seePro) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          className={`w-full ${PRIMARY_BUTTON}`}
          onClick={() => onGateAction()}
        >
          {gate.actionLabel}
        </button>
        {gate.secondaryActionLabel ? (
          <button
            type="button"
            className={`w-full ${SECONDARY_BUTTON}`}
            onClick={onGateSecondaryAction}
          >
            {gate.secondaryActionLabel}
          </button>
        ) : null}
        {gate.seePro ? (
          <Link href={PRO_PATH} className={`text-14 ${TEXT_LINK}`}>
            See Pro
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={PRIMARY_BUTTON}
      onClick={() => onGateAction()}
    >
      {gate.actionLabel}
    </button>
  );
}

type ActiveRailProps = {
  view: CanvasView;
  guess: string;
  suggestions: readonly Suggestion[];
  onGuessChange: (value: string) => void;
  onGuessSubmit: (guess: string) => void;
};

function ActiveRail({
  view,
  guess,
  suggestions,
  onGuessChange,
  onGuessSubmit,
}: ActiveRailProps) {
  const isTheirTurn = view.mode === 'duel' && view.turn === 'opponent';
  // The chip can't sit beside the ring under 414px
  const isReconnecting =
    view.mode === 'duel' && view.opponentConnection?.status === 'reconnecting';

  return (
    <>
      {view.mode === 'solo' && view.isPractice ? (
        <PracticeCard />
      ) : (
        <div
          className={`${RAIL_SECTION} flex flex-wrap items-center gap-4 border-b-2 border-line pb-3 sm:pb-4 lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-0 lg:border-b-0 lg:pb-0 ${
            isReconnecting ? 'max-[413px]:justify-center' : ''
          }`}
        >
          <ClockBlock view={view} />
          {/* Phones: a rule between clock and lives */}
          <div
            className={`flex min-w-0 flex-1 flex-col justify-center self-stretch border-line lg:flex-none lg:py-4 ${
              isReconnecting
                ? 'max-[413px]:basis-full min-[414px]:max-lg:border-l-2 min-[414px]:max-lg:pl-4'
                : 'max-lg:border-l-2 max-lg:pl-4'
            }`}
          >
            <RailLives view={view} />
          </div>
        </div>
      )}
      {view.mode === 'duel' ? (
        <p className="sr-only" aria-live="polite">
          {turnAnnouncement(
            view.turn,
            view.opponentConnection?.status === 'reconnecting',
          )}
        </p>
      ) : null}
      <div className="relative flex flex-col gap-2 border-line lg:mt-auto lg:-mx-4 lg:border-t-2 lg:px-4 lg:pt-4">
        {/* Phones: floats over the band's bottom */}
        <div className="pointer-events-none max-sm:absolute max-sm:inset-x-0 max-sm:bottom-full max-sm:mb-2">
          <FeedbackToast toast={view.toast} />
        </div>
        {/* Both layers share one cell: no shift on handover */}
        <div className="grid">
          <div
            inert={isTheirTurn}
            className={`col-start-1 row-start-1 ${isTheirTurn ? 'invisible' : ''}`}
          >
            <GuessInput
              status={view.input}
              cooldownUntil={view.cooldownUntil}
              value={guess}
              onValueChange={onGuessChange}
              onSubmit={onGuessSubmit}
              shakeKey={view.shakeKey}
              suggestions={suggestions}
            />
          </div>
          {view.mode === 'duel' && isTheirTurn ? (
            <p className="col-start-1 row-start-1 self-center text-center text-14 text-fg-muted">
              {waitingLine(
                view.opponent?.handle ?? null,
                view.opponentConnection?.status === 'reconnecting',
              )}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

type GameCanvasProps = {
  view: CanvasView;
  guess: string;
  // Null while loading or after a failed fetch
  directory?: SuggestionIndex | null;
  onGuessChange: (value: string) => void;
  onGuessSubmit: (guess: string) => void;
  onGateAction: (choiceId?: string) => void;
  onGateSecondaryAction?: () => void;
  // Without it, quitting is a plain link to /play
  onQuit?: () => void;
  onPlayAgain?: () => void;
  onChangeFilters?: () => void;
  // Back to play; Change filters when unset
  onBackToPlay?: () => void;
  // Solo at its daily cap: Play a duel instead
  onPlayDuel?: () => void;
  onRevealMissed?: () => void;
  onLobbyAction?: (action: LobbyAction) => void;
};

export function GameCanvas({
  view,
  guess,
  directory = null,
  onGuessChange,
  onGuessSubmit,
  onGateAction,
  onGateSecondaryAction = () => {},
  onQuit,
  onPlayAgain = () => {},
  onChangeFilters = () => {},
  onBackToPlay,
  onPlayDuel = () => {},
  onRevealMissed = () => {},
  onLobbyAction = () => {},
}: GameCanvasProps) {
  const soloEnd = view.mode === 'solo' ? view.end : null;
  const lobby = view.mode === 'duel' ? view.lobby : null;
  const result = view.mode === 'duel' ? view.end : null;
  const summary = soloEnd?.status === 'ready' ? soloEnd.summary : null;
  const isPerfectClear = summary?.endReason === 'perfect_clear';
  // The result's own links take over from quit
  const quitChip = summary || result ? null : <QuitChip onQuit={onQuit} />;
  const found = result?.found ?? view.found;
  const sidePick = view.gate?.sidePick;
  const notice = noticeParts(view.gate);
  const gateSize: GateSize = lobby
    ? LOBBY_GATE_SIZE[lobby.step]
    : sidePick
      ? 'wide'
      : 'narrow';
  useGameSounds(view);
  const query = useDeferredValue(guess);
  // Keyed by value: views are rebuilt every render
  const namedList = view.found.map((player) => player.directoryKey).join(' ');
  const namedKeys = useMemo(
    () => new Set(namedList.split(' ').filter(Boolean)),
    [namedList],
  );
  const suggestions = useMemo(
    () => (directory ? suggest(directory, query, namedKeys) : []),
    [directory, query, namedKeys],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4">
      <h1 className="sr-only">{HEADINGS[view.mode]}</h1>
      {/* Grid, so the gate's full-size box resolves */}
      <div className="relative grid flex-1 grid-cols-1">
        {/* On the scoreboard strip, but first in tab order */}
        <div className="pointer-events-none absolute inset-x-0.5 top-0.5 z-10 flex h-28 flex-col items-end justify-center gap-1 px-3 sm:h-20 sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:px-4">
          {quitChip ? (
            <div className="pointer-events-auto">{quitChip}</div>
          ) : null}
          <div className="pointer-events-auto">
            <SoundToggle />
          </div>
        </div>
        <CanvasGate
          isOpen={view.gate !== null}
          icon={notice.icon}
          title={view.gate?.title ?? ''}
          detail={notice.detail}
          size={gateSize}
          body={
            view.mode === 'duel' && lobby ? (
              <LobbyPanel
                lobby={lobby}
                you={view.you}
                opponent={view.opponent}
                onAction={onLobbyAction}
              />
            ) : sidePick ? (
              <SidePickCard sidePick={sidePick} onPick={onGateAction} />
            ) : (
              notice.body
            )
          }
          action={
            view.gate?.actionLabel ? (
              <GateAction
                gate={view.gate}
                onGateAction={onGateAction}
                onGateSecondaryAction={onGateSecondaryAction}
              />
            ) : undefined
          }
        >
          {/* One board: scoreboard, pitch and rail */}
          <div className="flex size-full flex-col overflow-hidden rounded-lg border-2 border-line bg-surface-raised shadow-hard">
            <section aria-label="Match" className="border-b-2 border-line">
              <MatchHeader match={view.match} hasControls />
            </section>
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div
                className={`relative flex min-w-0 flex-1 flex-col bg-turf p-2 sm:p-3 ${
                  isPerfectClear ? 'ring-4 ring-found ring-inset' : ''
                }`}
              >
                {view.match ? <FoundCount found={found} /> : null}
                {/* Below lg the width sets the height */}
                <div className="max-lg:aspect-[5/6] max-lg:max-h-[70svh] lg:min-h-80 lg:flex-1">
                  <SquadGrid
                    formation={view.match?.formation ?? LOADING_FORMATION}
                    revealed={found}
                    missed={missedOnPitch(soloEnd)}
                    pulse={view.pulse}
                    isLoading={view.match === null}
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 border-line p-3 max-lg:border-t-2 sm:gap-3 sm:p-4 lg:w-88 lg:border-l-2">
                {soloEnd ? (
                  <RunSummary
                    end={soloEnd}
                    capLine={view.mode === 'solo' ? view.capLine : undefined}
                    isPicked={view.mode === 'solo' && view.isPicked}
                    isPractice={view.mode === 'solo' && view.isPractice}
                    onPlayAgain={onPlayAgain}
                    onChangeFilters={onChangeFilters}
                    onBackToPlay={onBackToPlay}
                    onPlayDuel={onPlayDuel}
                    onRevealMissed={onRevealMissed}
                  />
                ) : result ? (
                  <DuelResultPanel
                    result={result}
                    isConnectionLost={
                      view.mode === 'duel' &&
                      view.endReason === 'connectionLost'
                    }
                    onPlayAgain={onPlayAgain}
                    onChangeFilters={onChangeFilters}
                    onBackToPlay={onBackToPlay}
                    isPrivate={view.mode === 'duel' && view.isPrivate}
                    hostAccess={
                      view.mode === 'duel' ? view.hostAccess : undefined
                    }
                  />
                ) : (
                  <ActiveRail
                    view={view}
                    guess={guess}
                    suggestions={suggestions}
                    onGuessChange={onGuessChange}
                    onGuessSubmit={onGuessSubmit}
                  />
                )}
              </div>
            </div>
          </div>
        </CanvasGate>
      </div>
      <LifeLostFlash flashKey={view.lifeLostKey} />
    </div>
  );
}
