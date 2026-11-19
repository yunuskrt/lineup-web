import React, { useId, type ReactNode } from 'react';
import { FILTER_LABEL, FILTER_ROW } from '@/components/play/styles';

type Props = {
  label: string;
  children: ReactNode;
};

const FilterRow = ({ label, children }: Props) => {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId} className={FILTER_ROW}>
      <span id={labelId} className={FILTER_LABEL}>
        {label}
      </span>
      {children}
    </div>
  );
};

export default FilterRow;
