import { ProLock } from '@/components/pro/ProLock';
import { type ResultPrimary, resultActionsLayout } from '@/lib/result-actions';
import { PRIMARY_BUTTON_LARGE, TEXT_LINK } from '@/styles/classes';
import type { ProAccess } from '@/types/pro';

export type ResultActionsProps = {
  onPlayAgain: () => void;
  onChangeFilters: () => void;
  // A room game: New room and Back to play
  isPrivate?: boolean;
  // Hosting is Pro (R10); open when unset
  hostAccess?: ProAccess;
  // Solo at its daily cap: Play a duel instead
  capLine?: string;
  onPlayDuel?: () => void;
};

const PRIMARY_LABELS: Record<ResultPrimary, string> = {
  playAgain: 'Play again',
  newRoom: 'New room',
  backToPlay: 'Back to play',
  playDuel: 'Play a duel',
};

export function ResultActions({
  onPlayAgain,
  onChangeFilters,
  isPrivate = false,
  hostAccess = 'open',
  capLine,
  onPlayDuel = () => {},
}: ResultActionsProps) {
  const { primary, secondary } = resultActionsLayout(
    isPrivate,
    hostAccess,
    capLine !== undefined,
  );
  const onPrimary =
    primary === 'backToPlay'
      ? onChangeFilters
      : primary === 'playDuel'
        ? onPlayDuel
        : onPlayAgain;

  return (
    <div className="flex flex-col items-center gap-3 lg:mt-auto">
      {capLine ? (
        <p className="text-center text-14 leading-5 text-balance text-fg-muted">
          {capLine}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onPrimary}
        className={`w-full ${PRIMARY_BUTTON_LARGE}`}
      >
        {PRIMARY_LABELS[primary]}
      </button>
      {secondary === 'lockedNewRoom' ? (
        <div className="w-full">
          <ProLock
            label="New room"
            caption="Pro hosts rooms."
            isPending={hostAccess === 'pending'}
            isFullWidth
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onChangeFilters}
          className={`text-14 leading-5 ${TEXT_LINK}`}
        >
          {secondary === 'backToPlay' ? 'Back to play' : 'Change filters'}
        </button>
      )}
    </div>
  );
}
