import React from 'react';
import FeedbackToast from '@/components/game/FeedbackToast';
import ClockBlock from '@/components/game/game-canvas/ClockBlock';
import RailLives from '@/components/game/game-canvas/RailLives';
import GuessInput from '@/components/game/GuessInput';
import PracticeCard from '@/components/game/PracticeCard';
import { turnAnnouncement, waitingLine } from '@/lib/duel-status';
import type { Suggestion } from '@/lib/suggestions';
import { RAIL_SECTION } from '@/styles/classes';
import type { CanvasView } from '@/types/canvas';

type Props = {
  view: CanvasView;
  guess: string;
  suggestions: readonly Suggestion[];
  onGuessChange: (value: string) => void;
  onGuessSubmit: (guess: string) => void;
};

const ActiveRail = ({
  view,
  guess,
  suggestions,
  onGuessChange,
  onGuessSubmit,
}: Props) => {
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
};

export default ActiveRail;
