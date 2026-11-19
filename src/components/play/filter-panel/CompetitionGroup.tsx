import React, { useId, type ReactNode } from 'react';

const FILTER_GROUP_LABEL = 'text-12 font-medium text-fg-muted';

type Props = {
  label: string;
  children: ReactNode;
};

const CompetitionGroup = ({ label, children }: Props) => {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <span id={labelId} className={FILTER_GROUP_LABEL}>
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
};

export default CompetitionGroup;
