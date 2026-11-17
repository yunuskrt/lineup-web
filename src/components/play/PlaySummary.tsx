import { STEP_EDIT } from '@/components/play/styles';
import { SKELETON } from '@/components/ui/skeleton';
import { filterSummary } from '@/lib/lobby';
import { MODE_OPTION_NAMES, type PlayStep } from '@/lib/play-steps';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';
import type { ModeOption } from '@/types/play';

type PlaySummaryProps = {
  option: ModeOption;
  // Null while the filters load
  filters: Filters | null;
  options: FilterOptions | null;
  onEdit: (step: PlayStep) => void;
};

type Row = { label: string; value: string | null };

const FILTER_LABELS = ['Competition', 'Club', 'Era'];

const GROUP =
  'flex flex-col items-start gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6';

function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid w-full min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
      {rows.map((row) => (
        <div key={row.label} className="col-span-2 grid grid-cols-subgrid">
          <dt className="text-14 text-fg-muted">{row.label}</dt>
          <dd className="text-16 font-semibold text-pretty">
            {row.value ?? (
              <>
                <span className="sr-only">Loading</span>
                <span
                  aria-hidden="true"
                  className={`inline-block h-4 w-28 align-middle ${SKELETON}`}
                />
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PlaySummary({
  option,
  filters,
  options,
  onEdit,
}: PlaySummaryProps) {
  const filterRows: Row[] =
    filters && options
      ? filterSummary(filters, options)
      : FILTER_LABELS.map((label) => ({ label, value: null }));

  return (
    <div className="flex flex-col divide-y-2 divide-line">
      <div className={GROUP}>
        <Rows rows={[{ label: 'Mode', value: MODE_OPTION_NAMES[option] }]} />
        <button
          type="button"
          onClick={() => onEdit('mode')}
          className={STEP_EDIT}
        >
          Edit mode
        </button>
      </div>
      <div className={GROUP}>
        <Rows rows={filterRows} />
        <button
          type="button"
          onClick={() => onEdit('filters')}
          className={STEP_EDIT}
        >
          Edit filters
        </button>
      </div>
    </div>
  );
}
