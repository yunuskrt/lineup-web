'use client';

import { useEffect, useState } from 'react';
import { LOBBY_GATE_SIZE, LobbyPanel } from '@/components/duel/LobbyPanel';
import { CanvasGate } from '@/components/game/CanvasGate';
import { CountdownRing } from '@/components/game/CountdownRing';
import { DuelResultPanel } from '@/components/game/DuelResultPanel';
import { FeedbackToast } from '@/components/game/FeedbackToast';
import { GuessInput } from '@/components/game/GuessInput';
import { LifeLostFlash } from '@/components/game/LifeLostFlash';
import { DuelLivesCard, LivesCard } from '@/components/game/LivesCard';
import { MatchHeader } from '@/components/game/MatchHeader';
import { RunSummary } from '@/components/game/RunSummary';
import { SquadGrid } from '@/components/pitch/SquadGrid';
import { QuitChip } from '@/components/shell/QuitChip';
import { activeRing, clockLabel } from '@/lib/canvas';
import {
  reconnectSecondsLeft,
  turnAnnouncement,
  waitingLine,
} from '@/lib/duel-status';
import { LOADING_FORMATION } from '@/lib/formation';
import {
  CHOICE_BUTTON,
  DUEL_ACTOR_TEXT,
  PRIMARY_BUTTON,
  TEXT_LINK,
} from '@/styles/classes';
import type {
  CanvasGateCountdown,
  CanvasGateView,
  CanvasView,
} from '@/types/canvas';
import type { LobbyAction } from '@/types/duel-lobby';

const PANEL = 'rounded-lg border bg-surface-raised';

const HEADINGS: Record<CanvasView['mode'], string> = {
  solo: 'Solo game',
  duel: 'Duel',
};

function ClockBlock({ view }: { view: CanvasView }) {
  const turn = view.mode === 'duel' ? view.turn : null;
  const ring = activeRing(view.clock, view.mode === 'duel' ? turn : 'you');
  const label = clockLabel(view.mode, turn);

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      {/* The duel label is the turn cue; keep it */}
      <span
        className={`text-12 leading-6 uppercase ${
          label.actor
            ? `font-semibold ${DUEL_ACTOR_TEXT[label.actor]}`
            : 'font-medium text-fg-muted'
        } ${view.mode === 'solo' ? 'max-lg:hidden' : ''}`}
      >
        {label.text}
      </span>
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

// Ticks to the server deadline; decides nothing
function GateCountdown({ countdown }: { countdown: CanvasGateCountdown }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    // Server and client clocks may differ by a tick
    <span suppressHydrationWarning>
      {countdown.label(reconnectSecondsLeft(countdown.deadline, now))}
    </span>
  );
}

type GateActionProps = {
  gate: CanvasGateView;
  onGateAction: (choiceId?: string) => void;
  onGateSecondaryAction: () => void;
};

function GateAction({
  gate,
  onGateAction,
  onGateSecondaryAction,
}: GateActionProps) {
  if (gate.choices) {
    return (
      <div className="flex flex-col gap-2">
        {gate.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={CHOICE_BUTTON}
            onClick={() => onGateAction(choice.id)}
          >
            {choice.label}
          </button>
        ))}
      </div>
    );
  }

  if (gate.secondaryActionLabel) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          className={`w-full ${PRIMARY_BUTTON}`}
          onClick={() => onGateAction()}
        >
          {gate.actionLabel}
        </button>
        <button
          type="button"
          className={`text-14 ${TEXT_LINK}`}
          onClick={onGateSecondaryAction}
        >
          {gate.secondaryActionLabel}
        </button>
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
  onGuessChange: (value: string) => void;
  onGuessSubmit: (guess: string) => void;
};

function ActiveRail({
  view,
  guess,
  onGuessChange,
  onGuessSubmit,
}: ActiveRailProps) {
  const isTheirTurn = view.mode === 'duel' && view.turn === 'opponent';

  return (
    <>
      <div className="flex items-center gap-4 lg:flex-col lg:items-stretch lg:gap-8">
        <ClockBlock view={view} />
        <div className="min-w-0 flex-1 lg:flex-none">
          <RailLives view={view} />
        </div>
      </div>
      {view.mode === 'duel' ? (
        <p className="sr-only" aria-live="polite">
          {turnAnnouncement(
            view.turn,
            view.opponentConnection?.status === 'reconnecting',
          )}
        </p>
      ) : null}
      <div className="relative flex flex-col gap-2 lg:mt-auto">
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
  onGuessChange: (value: string) => void;
  onGuessSubmit: (guess: string) => void;
  onGateAction: (choiceId?: string) => void;
  onGateSecondaryAction?: () => void;
  // Without it, quitting is a plain link to /play
  onQuit?: () => void;
  onPlayAgain?: () => void;
  onChangeFilters?: () => void;
  onLobbyAction?: (action: LobbyAction) => void;
};

export function GameCanvas({
  view,
  guess,
  onGuessChange,
  onGuessSubmit,
  onGateAction,
  onGateSecondaryAction = () => {},
  onQuit,
  onPlayAgain = () => {},
  onChangeFilters = () => {},
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4">
      <h1 className="sr-only">{HEADINGS[view.mode]}</h1>
      {/* Phones get the chip in the canvas header row */}
      <div className="hidden h-7 justify-end sm:flex">{quitChip}</div>
      {/* Grid, so the gate's full-size box resolves */}
      <div className="relative grid flex-1 grid-cols-1">
        {/* Phones: header row, but first in tab order */}
        <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex h-14 items-center justify-end px-2 sm:hidden">
          <div className="pointer-events-auto">{quitChip}</div>
        </div>
        <CanvasGate
          isOpen={view.gate !== null}
          title={view.gate?.title ?? ''}
          detail={
            view.gate?.countdown ? (
              <GateCountdown countdown={view.gate.countdown} />
            ) : (
              view.gate?.detail
            )
          }
          size={lobby ? LOBBY_GATE_SIZE[lobby.step] : 'narrow'}
          body={
            view.mode === 'duel' && lobby ? (
              <LobbyPanel
                lobby={lobby}
                you={view.you}
                opponent={view.opponent}
                onAction={onLobbyAction}
              />
            ) : undefined
          }
          action={
            view.gate?.actionLabel || view.gate?.choices ? (
              <GateAction
                gate={view.gate}
                onGateAction={onGateAction}
                onGateSecondaryAction={onGateSecondaryAction}
              />
            ) : undefined
          }
        >
          <div className="flex size-full flex-col gap-4 lg:flex-row">
            <section
              aria-label="Match"
              className={`flex min-w-0 flex-1 flex-col gap-2 p-2 ${PANEL} ${
                isPerfectClear ? 'border-found' : 'border-line'
              }`}
            >
              <MatchHeader
                match={view.match}
                found={found}
                identity={summary?.match ?? result?.match}
              />
              <div className="min-h-72 flex-1 sm:min-h-80">
                <SquadGrid
                  formation={view.match?.formation ?? LOADING_FORMATION}
                  revealed={found}
                  missed={summary?.missed ?? undefined}
                  pulse={view.pulse}
                  isLoading={view.match === null}
                />
              </div>
            </section>
            <div
              className={`flex shrink-0 flex-col gap-2 p-3 sm:gap-3 sm:p-4 lg:w-88 border-line ${PANEL}`}
            >
              {soloEnd ? (
                <RunSummary
                  end={soloEnd}
                  onPlayAgain={onPlayAgain}
                  onChangeFilters={onChangeFilters}
                />
              ) : result ? (
                <DuelResultPanel
                  result={result}
                  isConnectionLost={
                    view.mode === 'duel' && view.endReason === 'connectionLost'
                  }
                  onPlayAgain={onPlayAgain}
                  onChangeFilters={onChangeFilters}
                />
              ) : (
                <ActiveRail
                  view={view}
                  guess={guess}
                  onGuessChange={onGuessChange}
                  onGuessSubmit={onGuessSubmit}
                />
              )}
            </div>
          </div>
        </CanvasGate>
      </div>
      <LifeLostFlash flashKey={view.lifeLostKey} />
    </div>
  );
}
