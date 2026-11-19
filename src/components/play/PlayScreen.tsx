'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { flushSync } from 'react-dom';
import FiltersStep from '@/components/play/FiltersStep';
import ModeStep from '@/components/play/ModeStep';
import PlaySteps from '@/components/play/PlaySteps';
import SoloAllowanceNote from '@/components/play/SoloAllowanceNote';
import StartStep from '@/components/play/StartStep';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { useProAccess } from '@/hooks/use-pro';
import { useSoloAllowance } from '@/hooks/use-solo-allowance';
import { useSoundUnlock } from '@/hooks/use-sound';
import {
  filtersFromParams,
  filtersToParams,
  replaceQuery,
  withQuery,
} from '@/lib/filters';
import {
  MODE_OPTION_NAMES,
  modeOptionFrom,
  type PlayStep,
  playStepFrom,
  withModeOption,
  withStep,
} from '@/lib/play-steps';
import {
  hasOpenRun,
  modeOf,
  PRACTICE_OVER_RUN_COPY,
  withPractice,
} from '@/lib/practice';
import { joinCodeFrom } from '@/lib/room-code';
import { allowanceLine, isSoloCapped } from '@/lib/solo-allowance';
import { BOARD, BOARD_SECTION } from '@/styles/classes';
import type { Filters } from '@/types/filters';
import type { ModeOption } from '@/types/play';

type Props = {};

const PlayScreen = ({}: Props) => {
  // Live, for the step; Back and Forward change it
  const searchParams = useSearchParams();
  // A snapshot: the state holds the rest
  const [params] = useState(() => new URLSearchParams(searchParams));
  const [picked, setPicked] = useState(() => modeOptionFrom(params));
  const [edited, setEdited] = useState<Filters | null>(null);
  const options = useFilterOptions();
  // Practice is Pro (R14); the server still checks
  const practiceAccess = useProAccess();
  // A locked practice pick shows as Solo
  const option: ModeOption | null =
    picked === 'practice' && practiceAccess !== 'open' ? 'solo' : picked;
  const mode = option ? modeOf(option).mode : null;
  const isPractice = option === 'practice';
  // The server's count; nothing while unlimited
  const allowance = useSoloAllowance();
  const allowanceId = useId();
  // Practice never counts toward the cap
  const soloAllowance = option === 'solo' ? (allowance.data ?? null) : null;
  const soloLine = allowanceLine(soloAllowance);
  const isCapped = isSoloCapped(soloAllowance);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // The Start click unlocks sound for the game
  useSoundUnlock();

  const filters =
    edited ?? (options.data ? filtersFromParams(params, options.data) : null);
  const filterParams =
    filters && options.data ? filtersToParams(filters, options.data) : null;
  const step = playStepFrom(searchParams, picked !== null);
  // Filled once seen; Any is valid but unchosen
  const [hasSeenFilters, setHasSeenFilters] = useState(false);
  const progress = {
    hasMode: picked !== null,
    hasFilters: filters !== null && (hasSeenFilters || step !== 'mode'),
  };

  function queryFor(
    nextStep: PlayStep,
    nextPicked = picked,
    base = filterParams ?? params,
  ): URLSearchParams {
    return withStep(withModeOption(base, nextPicked), nextStep);
  }

  // Back or Forward: the entry takes the state
  const stateQuery = queryFor(step).toString();
  useEffect(() => {
    if (searchParams.toString() !== stateQuery) {
      replaceQuery(new URLSearchParams(stateQuery));
    }
  }, [searchParams, stateQuery]);

  // Focus follows the step, never on first load
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
    // The steps above the heading come into view too
    topRef.current?.scrollIntoView({ block: 'nearest' });
  }, [step]);

  function goTo(nextStep: PlayStep) {
    if (nextStep === step) return;
    if (nextStep !== 'mode') setHasSeenFilters(true);
    window.history.pushState(
      null,
      '',
      withQuery(window.location.pathname, queryFor(nextStep)),
    );
  }

  function changeOption(next: ModeOption) {
    setPicked(next);
    replaceQuery(queryFor(step, next));
  }

  function changeFilters(next: Filters) {
    if (!options.data) return;
    setEdited(next);
    replaceQuery(queryFor(step, picked, filtersToParams(next, options.data)));
  }

  // Its button goes; focus moves to what's next
  function playDuelInstead() {
    flushSync(() => changeOption('duel'));
    (step === 'start' ? startRef : nextRef).current?.focus();
  }

  const allowanceNote = soloLine ? (
    <SoloAllowanceNote
      id={allowanceId}
      line={soloLine}
      isCapped={isCapped}
      onPlayDuel={playDuelInstead}
    />
  ) : null;
  const startParams = filterParams && withPractice(filterParams, isPractice);

  return (
    <div className={BOARD}>
      <div ref={topRef} className={`scroll-mt-6 ${BOARD_SECTION}`}>
        <PlaySteps
          current={step}
          progress={progress}
          choices={{
            mode: option ? MODE_OPTION_NAMES[option] : undefined,
            filters: 'Your filters',
          }}
          onGo={goTo}
        />
      </div>
      {step === 'mode' ? (
        <ModeStep
          headingRef={headingRef}
          nextRef={nextRef}
          option={option}
          onChange={changeOption}
          practiceAccess={practiceAccess}
          allowance={allowanceNote}
          filterParams={filterParams}
          initialCode={joinCodeFrom(params)}
          onNext={() => goTo('filters')}
        />
      ) : null}
      {step === 'filters' ? (
        <FiltersStep
          headingRef={headingRef}
          filters={filters}
          options={options.data ?? null}
          onChange={changeFilters}
          error={options.isError ? options.error : null}
          onRetry={() => void options.refetch()}
          onBack={() => goTo('mode')}
          onNext={() => goTo('start')}
        />
      ) : null}
      {step === 'start' && option && mode ? (
        <StartStep
          headingRef={headingRef}
          startRef={startRef}
          option={option}
          mode={mode}
          filters={filters}
          options={options.data ?? null}
          filterParams={filterParams}
          href={startParams ? withQuery(`/play/${mode}`, startParams) : null}
          isCapped={isCapped}
          describedBy={soloLine ? allowanceId : undefined}
          label={isPractice ? 'Start practice' : undefined}
          warningFor={() =>
            isPractice && hasOpenRun() ? PRACTICE_OVER_RUN_COPY : null
          }
          allowance={allowanceNote}
          onGo={goTo}
        />
      ) : null}
    </div>
  );
};

export default PlayScreen;
