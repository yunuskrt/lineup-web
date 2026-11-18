import React from 'react';
import {
  CORNER,
  LABEL_BOX,
  TILE,
  TILES,
} from '@/components/home/home-archive/styles';
import LandingSkeleton from '@/components/home/LandingSkeleton';
import { SKELETON } from '@/components/ui/skeleton';

const FIGURE_COUNT = 4;

type Props = {};

// Same tiles as the loaded row, so nothing shifts
const ArchiveSkeleton = ({}: Props) => {
  return (
    <LandingSkeleton>
      <div className={TILES}>
        {Array.from({ length: FIGURE_COUNT }, (_, index) => (
          <div key={index} className={TILE}>
            <span className={CORNER} />
            <span className={`h-10 w-24 sm:h-15 sm:w-32 ${SKELETON}`} />
            <span className={LABEL_BOX}>
              <span className={`block h-5 w-20 sm:h-6 ${SKELETON}`} />
            </span>
          </div>
        ))}
      </div>
    </LandingSkeleton>
  );
};

export default ArchiveSkeleton;
