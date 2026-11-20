'use client';

import React, { type ReactNode, useDeferredValue, useMemo } from 'react';
import { CircleAlert, WifiOff } from 'lucide-react';
import LobbyPanel, { LOBBY_GATE_SIZE } from '@/components/duel/LobbyPanel';
import CanvasGate, { type GateSize } from '@/components/game/CanvasGate';
import DuelResultPanel from '@/components/game/DuelResultPanel';
import FoundCount from '@/components/game/FoundCount';
import ActiveRail from '@/components/game/game-canvas/ActiveRail';
import GateAction from '@/components/game/game-canvas/GateAction';
import GateCountdown from '@/components/game/game-canvas/GateCountdown';
import GateSeconds from '@/components/game/game-canvas/GateSeconds';
import LifeLostFlash from '@/components/game/LifeLostFlash';
import MatchHeader from '@/components/game/MatchHeader';
import RunSummary from '@/components/game/RunSummary';
import SidePickCard from '@/components/game/SidePickCard';
import SoundToggle from '@/components/game/SoundToggle';
import SquadGrid from '@/components/pitch/SquadGrid';
import { useGameSounds } from '@/hooks/use-game-sounds';
import QuitChip from '@/components/shell/QuitChip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LOADING_FORMATION } from '@/lib/formation';
import { suggest, type SuggestionIndex } from '@/lib/suggestions';
import { missedOnPitch } from '@/lib/summary';
import { ICON_TILE } from '@/styles/classes';
import type { CanvasGateView, CanvasView } from '@/types/canvas';
import type { LobbyAction } from '@/types/duel-lobby';

const HEADINGS: Record<CanvasView['mode'], string> = {
  solo: 'Solo game',
  duel: 'Duel',
};

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

type Props = {
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

const GameCanvas = ({
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
}: Props) => {
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
};

export default GameCanvas;
