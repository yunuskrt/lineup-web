import React, { type ReactNode } from 'react';
import { FILTER_LABEL, FILTER_ROW } from '@/components/play/styles';
import { SKELETON } from '@/components/ui/skeleton';

type Props = {
  label: string;
  children: ReactNode;
};

const SkeletonRow = ({ label, children }: Props) => {
  return (
    <div className={FILTER_ROW}>
      <div className={FILTER_LABEL}>
        <div className={`h-5.25 ${label} ${SKELETON}`} />
      </div>
      {children}
    </div>
  );
};

export default SkeletonRow;
