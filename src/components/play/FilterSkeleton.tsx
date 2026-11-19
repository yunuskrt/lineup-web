import React from 'react';
import { FILTER_NOTE } from '@/components/play/styles';
import { CLUB_HINT } from '@/components/play/shared';
import SkeletonRow from '@/components/play/filter-skeleton/SkeletonRow';
import { SKELETON } from '@/components/ui/skeleton';

const CHIP = `h-8.75 ${SKELETON}`;

// Measured from the mock catalog so rows wrap alike
const ANY_COMPETITION = 'w-[135.3px]';
const COMPETITION_GROUPS = [
  { caption: 'w-[48.9px]', chips: ['w-[150.9px]', 'w-[152.4px]'] },
  { caption: 'w-[86px]', chips: ['w-[241.3px]', 'w-[175.9px]'] },
  { caption: 'w-[71.7px]', chips: ['w-[285.8px]', 'w-[182.8px]'] },
];
const ANY_CLUB = 'w-[84.6px]';
// From and to, then a season select each
const SEASON_LABELS = ['w-[33.6px]', 'w-[12.8px]'];

type Props = {};

// Default view: no competition, no club chips
const FilterSkeleton = ({}: Props) => {
  return (
    <div aria-hidden="true">
      <SkeletonRow label="w-24">
        <div className="flex flex-col items-start gap-4">
          <div className={`${CHIP} ${ANY_COMPETITION}`} />
          {COMPETITION_GROUPS.map((group, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className={`h-4.5 ${group.caption} ${SKELETON}`} />
              <div className="flex flex-wrap gap-2">
                {group.chips.map((width) => (
                  <div key={width} className={`${CHIP} ${width}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SkeletonRow>
      <SkeletonRow label="w-10">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`${CHIP} ${ANY_CLUB}`} />
            <div
              className={`h-9.5 sm:h-8.75 max-md:w-full md:w-64 ${SKELETON}`}
            />
          </div>
          {/* The real copy, unseen, so it wraps alike */}
          <p className={FILTER_NOTE}>
            <span
              className={`text-transparent box-decoration-clone ${SKELETON}`}
            >
              {CLUB_HINT}
            </span>
          </p>
        </div>
      </SkeletonRow>
      <SkeletonRow label="w-8">
        <div className="flex flex-wrap items-center gap-3">
          {SEASON_LABELS.map((label) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`h-5.25 ${label} ${SKELETON}`} />
              <div className={`h-9.75 w-30 ${SKELETON}`} />
            </div>
          ))}
        </div>
      </SkeletonRow>
    </div>
  );
};

export default FilterSkeleton;
