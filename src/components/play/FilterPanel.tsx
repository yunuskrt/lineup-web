import { useId, useState, type ReactNode } from 'react';
import {
  ClubChipImage,
  CompetitionChipImage,
} from '@/components/play/FilterChipImage';
import {
  clubRowView,
  competitionGroups,
  effectiveSeasons,
  pickedCompetition,
  seasonLabel,
  selectCompetition,
  toggleId,
} from '@/lib/filters';
import { FILTER_CHIP, FILTER_SEARCH, FILTER_SELECT } from '@/styles/classes';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';

type FilterPanelProps = {
  options: FilterOptions;
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export const FILTER_ROW =
  'grid gap-3 border-t border-line py-5 md:grid-cols-[8rem_1fr] md:gap-6';

export const FILTER_LABEL = 'text-14 font-medium md:py-1.5';

const FILTER_GROUP_LABEL = 'text-12 font-medium text-fg-muted';

export const FILTER_NOTE = 'text-14 text-fg-muted';

export const CLUB_HINT =
  'Pick a competition to see its clubs, or search for one.';

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId} className={FILTER_ROW}>
      <span id={labelId} className={FILTER_LABEL}>
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  isPressed,
  onClick,
  image,
  children,
}: {
  isPressed: boolean;
  onClick: () => void;
  image?: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={isPressed}
      onClick={onClick}
      className={`${FILTER_CHIP} group inline-flex items-center gap-2`}
    >
      {image}
      {children}
    </button>
  );
}

function CompetitionGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <span id={labelId} className={FILTER_GROUP_LABEL}>
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function CompetitionFilter({ options, filters, onChange }: FilterPanelProps) {
  const picked = pickedCompetition(filters, options);

  function choose(id: string | null) {
    onChange(selectCompetition(filters, id, options));
  }

  return (
    <FilterRow label="Competition">
      <div className="flex flex-col items-start gap-4">
        <Chip isPressed={picked === null} onClick={() => choose(null)}>
          Any competition
        </Chip>
        {competitionGroups(options.competitions).map((group) => (
          <CompetitionGroup key={group.label} label={group.label}>
            {group.competitions.map((competition) => {
              const isPicked = picked?.id === competition.id;
              return (
                <Chip
                  key={competition.id}
                  isPressed={isPicked}
                  onClick={() => choose(isPicked ? null : competition.id)}
                  image={<CompetitionChipImage competition={competition} />}
                >
                  {competition.name}
                </Chip>
              );
            })}
          </CompetitionGroup>
        ))}
      </div>
    </FilterRow>
  );
}

function countLabel(count: number): string {
  return count === 1 ? '1 club found' : `${count} clubs found`;
}

// Keyed by competition: a new pick clears it
function ClubFilter({ options, filters, onChange }: FilterPanelProps) {
  const [query, setQuery] = useState('');
  const hintId = useId();
  const view = clubRowView(filters, options, query);

  return (
    <FilterRow label="Club">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            isPressed={filters.clubIds.length === 0}
            onClick={() => onChange({ ...filters, clubIds: [] })}
          >
            Any club
          </Chip>
          {view.hasSearch ? (
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search clubs"
              aria-describedby={view.isSearchingAll ? hintId : undefined}
              placeholder="Search clubs"
              className={`${FILTER_SEARCH} max-md:w-full md:w-64`}
            />
          ) : null}
        </div>
        {view.isSearchingAll ? (
          <p id={hintId} className={FILTER_NOTE}>
            {CLUB_HINT}
          </p>
        ) : null}
        {view.clubs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {view.clubs.map((club) => (
              <Chip
                key={club.id}
                isPressed={filters.clubIds.includes(club.id)}
                image={<ClubChipImage club={club} />}
                onClick={() =>
                  onChange({
                    ...filters,
                    clubIds: toggleId(filters.clubIds, club.id, options.clubs),
                  })
                }
              >
                {club.name}
              </Chip>
            ))}
          </div>
        ) : null}
        {view.matchCount === 0 ? (
          <p className={FILTER_NOTE}>No club matches that name.</p>
        ) : null}
        {view.moreCount > 0 ? (
          <p className={FILTER_NOTE}>
            {view.moreCount} more. Keep typing to narrow it down.
          </p>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {view.matchCount === null ? '' : countLabel(view.matchCount)}
        </p>
      </div>
    </FilterRow>
  );
}

function EraFilter({ options, filters, onChange }: FilterPanelProps) {
  const { era } = filters;
  const seasons = effectiveSeasons(filters, options);

  return (
    <FilterRow label="Era">
      <div className="flex flex-wrap items-center gap-3 text-14 text-fg-muted">
        <label className="flex items-center gap-3">
          From
          <select
            value={era.from}
            onChange={(event) => {
              const from = Number(event.target.value);
              onChange({
                ...filters,
                era: { from, to: Math.max(from, era.to) },
              });
            }}
            className={FILTER_SELECT}
          >
            {seasons.map((season) => (
              <option key={season} value={season}>
                {seasonLabel(season)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-3">
          to
          <select
            value={era.to}
            onChange={(event) =>
              onChange({
                ...filters,
                era: { ...era, to: Number(event.target.value) },
              })
            }
            className={FILTER_SELECT}
          >
            {seasons
              .filter((season) => season >= era.from)
              .map((season) => (
                <option key={season} value={season}>
                  {seasonLabel(season)}
                </option>
              ))}
          </select>
        </label>
      </div>
    </FilterRow>
  );
}

export function FilterPanel(props: FilterPanelProps) {
  const picked = pickedCompetition(props.filters, props.options);

  return (
    <div className="border-b border-line">
      <CompetitionFilter {...props} />
      <ClubFilter key={picked?.id ?? 'any'} {...props} />
      <EraFilter {...props} />
    </div>
  );
}
