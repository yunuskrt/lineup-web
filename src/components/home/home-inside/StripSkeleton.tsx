import React from 'react';
import { STRIP } from '@/components/home/home-inside/styles';
import LandingSkeleton from '@/components/home/LandingSkeleton';
import { SKELETON } from '@/components/ui/skeleton';

const SKELETON_TILES = 10;

type Props = {};

const StripSkeleton = ({}: Props) => {
  return (
    <LandingSkeleton>
      <div className={STRIP}>
        <div className="flex gap-3 overflow-hidden px-4">
          {Array.from({ length: SKELETON_TILES }, (_, index) => (
            <span key={index} className={`h-11 w-32 shrink-0 ${SKELETON}`} />
          ))}
        </div>
      </div>
    </LandingSkeleton>
  );
};

export default StripSkeleton;
