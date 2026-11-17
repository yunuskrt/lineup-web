import type { ReactNode, RefObject } from 'react';
import { JoinRoom } from '@/components/play/JoinRoom';
import { ModeChoice } from '@/components/play/ModeChoice';
import {
  STEP_ACTIONS,
  STEP_HEADING,
  STEP_NEXT,
} from '@/components/play/styles';
import { BOARD_SECTION } from '@/styles/classes';
import type { ModeOption } from '@/types/play';
import type { ProAccess } from '@/types/pro';

type ModeStepProps = {
  headingRef: RefObject<HTMLHeadingElement | null>;
  option: ModeOption | null;
  onChange: (option: ModeOption) => void;
  practiceAccess: ProAccess;
  // The solo runs-left or cap line
  allowance: ReactNode;
  filterParams: URLSearchParams | null;
  initialCode: string;
  onNext: () => void;
  nextRef: RefObject<HTMLButtonElement | null>;
};

export function ModeStep({
  headingRef,
  option,
  onChange,
  practiceAccess,
  allowance,
  filterParams,
  initialCode,
  onNext,
  nextRef,
}: ModeStepProps) {
  return (
    <>
      <section aria-labelledby="play-step-mode" className={BOARD_SECTION}>
        <h2
          ref={headingRef}
          id="play-step-mode"
          tabIndex={-1}
          className={STEP_HEADING}
        >
          Choose a mode
        </h2>
        <ModeChoice
          option={option}
          onChange={onChange}
          practiceAccess={practiceAccess}
          isLegendHidden
        />
        {allowance}
      </section>
      {/* Joining skips filters: the creator's set applies */}
      {option === 'duel' ? (
        <JoinRoom filterParams={filterParams} initialCode={initialCode} />
      ) : null}
      <div className={BOARD_SECTION}>
        <div className={STEP_ACTIONS}>
          <button
            ref={nextRef}
            type="button"
            disabled={!option}
            onClick={onNext}
            className={STEP_NEXT}
          >
            Next: filters
          </button>
        </div>
      </div>
    </>
  );
}
