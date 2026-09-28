import { PRIMARY_BUTTON_LARGE, TEXT_LINK } from '@/styles/classes';

export type ResultActionsProps = {
  onPlayAgain: () => void;
  onChangeFilters: () => void;
};

export function ResultActions({
  onPlayAgain,
  onChangeFilters,
}: ResultActionsProps) {
  return (
    <div className="flex flex-col items-center gap-3 lg:mt-auto">
      <button
        type="button"
        onClick={onPlayAgain}
        className={`w-full ${PRIMARY_BUTTON_LARGE}`}
      >
        Play again
      </button>
      <button
        type="button"
        onClick={onChangeFilters}
        className={`text-14 leading-5 ${TEXT_LINK}`}
      >
        Change filters
      </button>
    </div>
  );
}
