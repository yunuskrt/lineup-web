'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { FilterPanel } from '@/components/play/FilterPanel';
import { FilterSkeleton } from '@/components/play/FilterSkeleton';
import { ModeChoice } from '@/components/play/ModeChoice';
import { PlayStart } from '@/components/play/PlayStart';
import { PracticeToggle } from '@/components/play/PracticeToggle';
import { RoomControls } from '@/components/play/RoomControls';
import { SoloAllowanceNote } from '@/components/play/SoloAllowanceNote';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { useProAccess } from '@/hooks/use-pro';
import { useSoloAllowance } from '@/hooks/use-solo-allowance';
import { useSoundUnlock } from '@/hooks/use-sound';
import { ARCHIVE_PATH } from '@/lib/archive';
import { authErrorMessageOf } from '@/lib/auth';
import {
  FILTER_PARAMS,
  filtersFromParams,
  filtersToParams,
  playModeFrom,
  replaceQuery,
  withMode,
  withQuery,
} from '@/lib/filters';
import {
  hasOpenRun,
  isPracticeFrom,
  PRACTICE_OVER_RUN_COPY,
  withPractice,
} from '@/lib/practice';
import { joinCodeFrom } from '@/lib/room-code';
import { allowanceLine, isSoloCapped } from '@/lib/solo-allowance';
import { SECONDARY_BUTTON, TEXT_LINK } from '@/styles/classes';
import type { Filters } from '@/types/filters';
import type { PlayMode } from '@/types/play';

export function PlayScreen() {
  // Page props go stale after replaceState; this won't
  const searchParams = useSearchParams();
  const [params] = useState(() => new URLSearchParams(searchParams));
  const [mode, setMode] = useState(() =>
    playModeFrom(params.get(FILTER_PARAMS.mode)),
  );
  const [edited, setEdited] = useState<Filters | null>(null);
  const options = useFilterOptions();
  // The server's count; nothing while unlimited
  const allowance = useSoloAllowance();
  const allowanceId = useId();
  // Practice is Pro (R14); the server still checks
  const practiceAccess = useProAccess();
  const [practice, setPractice] = useState(() => isPracticeFrom(params));
  const isPractice = mode === 'solo' && practice && practiceAccess === 'open';
  // Practice never counts toward the cap
  const soloAllowance =
    mode === 'solo' && !isPractice ? (allowance.data ?? null) : null;
  const soloLine = allowanceLine(soloAllowance);
  const isCapped = isSoloCapped(soloAllowance);
  const startRef = useRef<HTMLButtonElement>(null);
  // The Start click unlocks sound for the game
  useSoundUnlock();

  const filters =
    edited ?? (options.data ? filtersFromParams(params, options.data) : null);
  const filterParams =
    filters && options.data ? filtersToParams(filters, options.data) : null;

  // The URL keeps filters, mode and practice
  function syncUrl(base: URLSearchParams, nextMode: PlayMode, on: boolean) {
    replaceQuery(withPractice(withMode(base, nextMode), on));
  }

  function changeMode(next: PlayMode) {
    setMode(next);
    syncUrl(filterParams ?? params, next, practice);
  }

  // Its button goes; Start enables after it
  function playDuelInstead() {
    flushSync(() => changeMode('duel'));
    startRef.current?.focus();
  }

  function changeFilters(next: Filters) {
    if (!options.data) return;
    setEdited(next);
    syncUrl(filtersToParams(next, options.data), mode, practice);
  }

  function changePractice(on: boolean) {
    setPractice(on);
    syncUrl(filterParams ?? params, mode, on);
  }

  const startParams = filterParams && withPractice(filterParams, isPractice);

  return (
    <div className="flex flex-col gap-12">
      <ModeChoice mode={mode} onChange={changeMode} />
      <section
        aria-labelledby="play-filters"
        className="flex max-w-4xl flex-col gap-8"
      >
        <div>
          <h2 id="play-filters" className="text-20 font-semibold">
            Match filters
          </h2>
          <p className="mt-2 text-14 text-fg-muted">
            Choose where the match comes from. Leave a group on Any to include
            all of it.
          </p>
        </div>
        {/* A failed background refetch keeps its data */}
        {filters && options.data ? (
          <FilterPanel
            options={options.data}
            filters={filters}
            onChange={changeFilters}
          />
        ) : options.isError ? (
          <div className="flex flex-col items-start gap-4">
            <p role="alert" className="text-14 text-danger">
              {authErrorMessageOf(options.error)}
            </p>
            <button
              type="button"
              onClick={() => options.refetch()}
              className={SECONDARY_BUTTON}
            >
              Try again
            </button>
          </div>
        ) : (
          <FilterSkeleton />
        )}
        {mode === 'solo' ? (
          <PracticeToggle
            access={practiceAccess}
            isOn={practice}
            onChange={changePractice}
          />
        ) : null}
        <PlayStart
          ref={startRef}
          mode={mode}
          href={startParams ? withQuery(`/play/${mode}`, startParams) : null}
          isCapped={isCapped}
          describedBy={soloLine ? allowanceId : undefined}
          label={isPractice ? 'Start practice' : undefined}
          warningFor={() =>
            isPractice && hasOpenRun() ? PRACTICE_OVER_RUN_COPY : null
          }
        >
          {soloLine ? (
            <SoloAllowanceNote
              id={allowanceId}
              line={soloLine}
              isCapped={isCapped}
              onPlayDuel={playDuelInstead}
            />
          ) : null}
          {mode === 'solo' && !isCapped ? (
            <p className="text-14 text-fg-muted">
              Or pick the exact match from{' '}
              <Link href={ARCHIVE_PATH} className={TEXT_LINK}>
                the archive
              </Link>
            </p>
          ) : null}
        </PlayStart>
        {mode === 'duel' ? (
          <RoomControls
            filterParams={filterParams}
            initialCode={joinCodeFrom(params)}
          />
        ) : null}
      </section>
    </div>
  );
}
