import React from 'react';
import type { FilterSummary } from '@/types/duel-lobby';

type Props = { summary: FilterSummary };

const SummaryList = ({ summary }: Props) => {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-14">
      {summary.map((line) => (
        <div key={line.label} className="contents">
          <dt className="text-fg-muted">{line.label}</dt>
          <dd className="min-w-0 text-pretty text-fg">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
};

export default SummaryList;
