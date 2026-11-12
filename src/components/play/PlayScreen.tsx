'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';
import { FilterPanel } from '@/components/play/FilterPanel';
import { FilterSkeleton } from '@/components/play/FilterSkeleton';
import { ModeChoice } from '@/components/play/ModeChoice';
import { PlayStart } from '@/components/play/PlayStart';
import { RoomControls } from '@/components/play/RoomControls';
import { SoloAllowanceNote } from '@/components/play/SoloAllowanceNote';
import { useFilterOptions } from '@/hooks/use-filter-options';
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
  const soloAllowance = mode === 'solo' ? (allowance.data ?? null) : null;
  const soloLine = allowanceLine(soloAllowance);
  const isCapped = isSoloCapped(soloAllowance);
  // The Start click unlocks sound for the game
  useSoundUnlock();

  const filters =
    edited ?? (options.data ? filtersFromParams(params, options.data) : null);
  const filterParams =
    filters && options.data ? filtersToParams(filters, options.data) : null;

  function changeMode(next: PlayMode) {
    setMode(next);
    replaceQuery(withMode(filterParams ?? params, next));
  }

  function changeFilters(next: Filters) {
    if (!options.data) return;
    setEdited(next);
    replaceQuery(withMode(filtersToParams(next, options.data), mode));
  }

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
        <PlayStart
          mode={mode}
          href={filterParams ? withQuery(`/play/${mode}`, filterParams) : null}
          isCapped={isCapped}
          describedBy={soloLine ? allowanceId : undefined}
        >
          {soloLine ? (
            <SoloAllowanceNote
              id={allowanceId}
              line={soloLine}
              isCapped={isCapped}
              onPlayDuel={() => changeMode('duel')}
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
