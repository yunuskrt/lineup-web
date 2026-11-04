import type { ReactNode } from 'react';
import {
  CLUB_HINT,
  FILTER_LABEL,
  FILTER_NOTE,
  FILTER_ROW,
} from '@/components/play/FilterPanel';

const BAR = 'rounded-sm bg-skeleton-fill';
const CHIP = `h-8.75 ${BAR}`;

// Measured from the mock catalog so rows wrap alike
const ANY_COMPETITION = 'w-[135.3px]';
const COMPETITION_GROUPS = [
  { caption: 'w-[48.9px]', chips: ['w-[123px]', 'w-[124.4px]'] },
  { caption: 'w-[86px]', chips: ['w-[213.3px]', 'w-[148px]'] },
  { caption: 'w-[71.7px]', chips: ['w-[257.8px]', 'w-[154.8px]'] },
];
const ANY_CLUB = 'w-[84.6px]';

function SkeletonRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={FILTER_ROW}>
      <div className={FILTER_LABEL}>
        <div className={`h-5.25 ${label} ${BAR}`} />
      </div>
      {children}
    </div>
  );
}

// Default view: no competition, no club chips
export function FilterSkeleton() {
  return (
    <div aria-hidden="true" className="border-b border-line">
      <SkeletonRow label="w-24">
        <div className="flex flex-col items-start gap-4">
          <div className={`${CHIP} ${ANY_COMPETITION}`} />
          {COMPETITION_GROUPS.map((group, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className={`h-4.5 ${group.caption} ${BAR}`} />
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
            <div className={`h-9.5 sm:h-8.75 max-md:w-full md:w-64 ${BAR}`} />
          </div>
          {/* The real copy, unseen, so it wraps alike */}
          <p className={FILTER_NOTE}>
            <span className={`text-transparent box-decoration-clone ${BAR}`}>
              {CLUB_HINT}
            </span>
          </p>
        </div>
      </SkeletonRow>
      <SkeletonRow label="w-8">
        <div className={`h-9.25 w-74 ${BAR}`} />
      </SkeletonRow>
    </div>
  );
}
