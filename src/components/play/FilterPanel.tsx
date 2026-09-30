import { useId, type ReactNode } from 'react';
import { seasonLabel, seasonsIn, toggleId } from '@/lib/filters';
import { FILTER_CHIP, FILTER_SELECT } from '@/styles/classes';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';

type FilterPanelProps = {
  options: FilterOptions;
  filters: Filters;
  onChange: (filters: Filters) => void;
};

type ChipGroupProps = {
  label: string;
  anyLabel: string;
  items: readonly { id: string; name: string }[];
  selected: readonly string[];
  onChange: (ids: string[]) => void;
};

export const FILTER_ROW =
  'grid gap-3 border-t border-line py-5 md:grid-cols-[8rem_1fr] md:gap-6';

export const FILTER_LABEL = 'text-14 font-medium md:py-1.5';

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

function ChipGroup({
  label,
  anyLabel,
  items,
  selected,
  onChange,
}: ChipGroupProps) {
  return (
    <FilterRow label={label}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={selected.length === 0}
          onClick={() => onChange([])}
          className={FILTER_CHIP}
        >
          {anyLabel}
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected.includes(item.id)}
            onClick={() => onChange(toggleId(selected, item.id, items))}
            className={FILTER_CHIP}
          >
            {item.name}
          </button>
        ))}
      </div>
    </FilterRow>
  );
}

export function FilterPanel({ options, filters, onChange }: FilterPanelProps) {
  const { era } = filters;

  return (
    <div className="border-b border-line">
      <ChipGroup
        label="Competition"
        anyLabel="Any competition"
        items={options.competitions}
        selected={filters.competitionIds}
        onChange={(competitionIds) => onChange({ ...filters, competitionIds })}
      />
      <ChipGroup
        label="Club"
        anyLabel="Any club"
        items={options.clubs}
        selected={filters.clubIds}
        onChange={(clubIds) => onChange({ ...filters, clubIds })}
      />
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
              {seasonsIn(options.era).map((season) => (
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
              {seasonsIn({ from: era.from, to: options.era.to }).map(
                (season) => (
                  <option key={season} value={season}>
                    {seasonLabel(season)}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </FilterRow>
    </div>
  );
}
