'use client';

import { CanvasGate } from '@/components/game/CanvasGate';
import { CountdownRing } from '@/components/game/CountdownRing';
import { FeedbackToast } from '@/components/game/FeedbackToast';
import { GuessInput } from '@/components/game/GuessInput';
import { LifeLostFlash } from '@/components/game/LifeLostFlash';
import { Lives } from '@/components/game/Lives';
import { MatchHeader } from '@/components/game/MatchHeader';
import { RunSummary } from '@/components/game/RunSummary';
import { TurnIndicator } from '@/components/game/TurnIndicator';
import { SquadGrid } from '@/components/pitch/SquadGrid';
import { QuitChip } from '@/components/shell/QuitChip';
import { ringSetups } from '@/lib/canvas';
import { LOADING_FORMATION } from '@/lib/formation';
import { CHOICE_BUTTON, PRIMARY_BUTTON } from '@/styles/classes';
import type { CanvasGateView, CanvasView } from '@/types/canvas';

const PANEL = 'rounded-lg border bg-surface-raised';

const HEADINGS: Record<CanvasView['mode'], string> = {
  solo: 'Solo game',
  duel: 'Duel',
};

function ClockRow({ view }: { view: CanvasView }) {
  const turn = view.mode === 'duel' ? view.turn : 'you';
  const rings = ringSetups(view.clock, turn);

  if (view.mode === 'solo') {
    return (
      <div className="flex items-center justify-between gap-4">
        <CountdownRing round={rings.you.round} mode={rings.you.mode} />
        <Lives lives={view.lives} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <CountdownRing round={rings.you.round} mode={rings.you.mode} />
      <CountdownRing
        round={rings.opponent.round}
        mode={rings.opponent.mode}
        owner="opponent"
      />
    </div>
  );
}

type GateActionProps = {
  gate: CanvasGateView;
  onGateAction: (choiceId?: string) => void;
};

function GateAction({ gate, onGateAction }: GateActionProps) {
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
      <ClockRow view={view} />
      <div className="relative flex flex-col gap-2 lg:mt-auto">
        {/* Phones: floats over the clock row's bottom */}
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
              value={guess}
              onValueChange={onGuessChange}
              onSubmit={onGuessSubmit}
              shakeKey={view.shakeKey}
            />
          </div>
          {view.mode === 'duel' && isTheirTurn ? (
            <p className="col-start-1 row-start-1 self-center text-center text-14 text-fg-muted">
              Waiting for {view.opponent.handle}
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
  // Without it, quitting is a plain link to /play
  onQuit?: () => void;
  onPlayAgain?: () => void;
  onChangeFilters?: () => void;
};

export function GameCanvas({
  view,
  guess,
  onGuessChange,
  onGuessSubmit,
  onGateAction,
  onQuit,
  onPlayAgain = () => {},
  onChangeFilters = () => {},
}: GameCanvasProps) {
  const end = view.mode === 'solo' ? view.end : null;
  const summary = end?.status === 'ready' ? end.summary : null;
  const isPerfectClear = summary?.endReason === 'perfect_clear';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4">
      <h1 className="sr-only">{HEADINGS[view.mode]}</h1>
      {/* Phones get the chip in the canvas header row */}
      <div className="hidden justify-end sm:flex">
        <QuitChip onQuit={onQuit} />
      </div>
      {view.mode === 'duel' ? (
        <TurnIndicator
          you={view.you}
          opponent={view.opponent}
          turn={view.turn}
        />
      ) : null}
      {/* Grid, so the gate's full-size box resolves */}
      <div className="relative grid flex-1 grid-cols-1">
        <CanvasGate
          isOpen={view.gate !== null}
          title={view.gate?.title ?? ''}
          detail={view.gate?.detail}
          action={
            view.gate?.actionLabel || view.gate?.choices ? (
              <GateAction gate={view.gate} onGateAction={onGateAction} />
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
                found={view.found}
                identity={summary?.match}
              />
              <div className="min-h-72 flex-1 sm:min-h-80">
                <SquadGrid
                  formation={view.match?.formation ?? LOADING_FORMATION}
                  revealed={view.found}
                  missed={summary?.missed ?? undefined}
                  pulse={view.pulse}
                  isLoading={view.match === null}
                />
              </div>
            </section>
            <div
              className={`flex shrink-0 flex-col gap-2 p-3 sm:gap-3 sm:p-4 lg:w-88 border-line ${PANEL}`}
            >
              {end ? (
                <RunSummary
                  end={end}
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
        {/* Phones: in the header row, outside the gate */}
        <div className="pointer-events-none absolute inset-x-2 top-2 flex h-14 items-center justify-end px-2 sm:hidden">
          <div className="pointer-events-auto">
            <QuitChip onQuit={onQuit} />
          </div>
        </div>
      </div>
      <LifeLostFlash flashKey={view.lifeLostKey} />
    </div>
  );
}
