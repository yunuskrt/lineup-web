import React from 'react';
import { SKELETON } from '@/components/ui/skeleton';

type Props = { hasHint: boolean };

// Heights mirror the real switch, fields and buttons
const FieldSkeleton = ({ hasHint }: Props) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-5.25 w-20 ${SKELETON}`} />
      <div className={`h-11.5 w-full ${SKELETON}`} />
      {hasHint ? <div className={`h-4.5 w-32 ${SKELETON}`} /> : null}
    </div>
  );
};

export default FieldSkeleton;
