import type { RefObject } from 'react';
import { FilterPanel } from '@/components/play/FilterPanel';
import { FilterSkeleton } from '@/components/play/FilterSkeleton';
import {
  STEP_ACTIONS,
  STEP_NEXT,
  STEP_BACK,
  STEP_HEADING,
  STEP_INTRO,
} from '@/components/play/styles';
import RetryNotice from '@/components/shell/RetryNotice';
import { authErrorMessageOf } from '@/lib/auth';
import { BOARD_SECTION } from '@/styles/classes';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';

type FiltersStepProps = {
  headingRef: RefObject<HTMLHeadingElement | null>;
  filters: Filters | null;
  options: FilterOptions | null;
  onChange: (filters: Filters) => void;
  error: unknown;
  onRetry: () => void;
  onBack: () => void;
  onNext: () => void;
};

export function FiltersStep({
  headingRef,
  filters,
  options,
  onChange,
  error,
  onRetry,
  onBack,
  onNext,
}: FiltersStepProps) {
  return (
    <>
      <section aria-labelledby="play-step-filters" className={BOARD_SECTION}>
        <div className="flex flex-col gap-2">
          <h2
            ref={headingRef}
            id="play-step-filters"
            tabIndex={-1}
            className={STEP_HEADING}
          >
            Choose filters
          </h2>
          <p className={STEP_INTRO}>
            Choose where the match comes from. Leave a group on Any to include
            all of it.
          </p>
        </div>
        {/* A failed background refetch keeps its data */}
        {filters && options ? (
          <FilterPanel
            options={options}
            filters={filters}
            onChange={onChange}
          />
        ) : error ? (
          <RetryNotice message={authErrorMessageOf(error)} onRetry={onRetry} />
        ) : (
          <FilterSkeleton />
        )}
      </section>
      <div className={BOARD_SECTION}>
        <div className={STEP_ACTIONS}>
          <button type="button" onClick={onBack} className={STEP_BACK}>
            Back
          </button>
          <button
            type="button"
            disabled={!filters}
            onClick={onNext}
            className={STEP_NEXT}
          >
            Next: start
          </button>
        </div>
      </div>
    </>
  );
}
