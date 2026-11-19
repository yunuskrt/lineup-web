import React from 'react';
import { SKELETON } from '@/components/ui/skeleton';

export type Row = { label: string; value: string | null };

type Props = { rows: Row[] };

const Rows = ({ rows }: Props) => {
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
};

export default Rows;
