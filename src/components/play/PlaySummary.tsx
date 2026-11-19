import React from 'react';
import { STEP_EDIT } from '@/components/play/styles';
import Rows, { type Row } from '@/components/play/play-summary/Rows';
import { filterSummary } from '@/lib/lobby';
import { MODE_OPTION_NAMES, type PlayStep } from '@/lib/play-steps';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';
import type { ModeOption } from '@/types/play';

type Props = {
  option: ModeOption;
  // Null while the filters load
  filters: Filters | null;
  options: FilterOptions | null;
  onEdit: (step: PlayStep) => void;
};

const FILTER_LABELS = ['Competition', 'Club', 'Era'];

const GROUP =
  'flex flex-col items-start gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6';

const PlaySummary = ({ option, filters, options, onEdit }: Props) => {
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
};

export default PlaySummary;
