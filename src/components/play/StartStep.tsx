import React, { type ReactNode, type RefObject } from 'react';
import Link from 'next/link';
import CreateRoom from '@/components/play/CreateRoom';
import PlayStart from '@/components/play/PlayStart';
import PlaySummary from '@/components/play/PlaySummary';
import { STEP_BACK, STEP_HEADING } from '@/components/play/styles';
import type { QuitDialogCopy } from '@/components/game/QuitDialog';
import { ARCHIVE_PATH } from '@/lib/archive';
import type { PlayStep } from '@/lib/play-steps';
import { BOARD_SECTION, TEXT_LINK } from '@/styles/classes';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';
import type { ModeOption, PlayMode } from '@/types/play';

type Props = {
  headingRef: RefObject<HTMLHeadingElement | null>;
  startRef: RefObject<HTMLButtonElement | null>;
  option: ModeOption;
  mode: PlayMode;
  filters: Filters | null;
  options: FilterOptions | null;
  filterParams: URLSearchParams | null;
  href: string | null;
  isCapped: boolean;
  describedBy?: string;
  label?: string;
  warningFor: () => QuitDialogCopy | null;
  // The solo runs-left or cap line
  allowance: ReactNode;
  onGo: (step: PlayStep) => void;
};

const StartStep = ({
  headingRef,
  startRef,
  option,
  mode,
  filters,
  options,
  filterParams,
  href,
  isCapped,
  describedBy,
  label,
  warningFor,
  allowance,
  onGo,
}: Props) => {
  return (
    <>
      <section aria-labelledby="play-step-start" className={BOARD_SECTION}>
        <h2
          ref={headingRef}
          id="play-step-start"
          tabIndex={-1}
          className={STEP_HEADING}
        >
          Ready to play
        </h2>
        <PlaySummary
          option={option}
          filters={filters}
          options={options}
          onEdit={onGo}
        />
      </section>
      <div className={BOARD_SECTION}>
        <PlayStart
          ref={startRef}
          mode={mode}
          href={href}
          isCapped={isCapped}
          describedBy={describedBy}
          label={label}
          warningFor={warningFor}
          leading={
            <button
              type="button"
              onClick={() => onGo('filters')}
              className={STEP_BACK}
            >
              Back
            </button>
          }
        >
          {allowance}
          {mode === 'solo' && !isCapped ? (
            <p className="text-14 text-fg-muted">
              Or pick the exact match from{' '}
              <Link href={ARCHIVE_PATH} className={TEXT_LINK}>
                the archive
              </Link>
            </p>
          ) : null}
        </PlayStart>
      </div>
      {mode === 'duel' ? <CreateRoom filterParams={filterParams} /> : null}
    </>
  );
};

export default StartStep;
