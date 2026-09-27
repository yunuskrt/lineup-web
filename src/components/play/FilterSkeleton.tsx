import { FILTER_LABEL, FILTER_ROW } from '@/components/play/FilterPanel';

const BAR = 'rounded-sm bg-skeleton-fill';

// Measured from the mock catalog so rows wrap alike
const COMPETITION_CHIPS = [
  'w-[135.3px]',
  'w-[213.3px]',
  'w-[257.8px]',
  'w-[123px]',
  'w-[148px]',
  'w-[154.8px]',
  'w-[124.4px]',
];
const CLUB_CHIPS = [
  'w-[84.6px]',
  'w-[152.2px]',
  'w-[112.2px]',
  'w-[86px]',
  'w-[128.7px]',
  'w-[141px]',
  'w-[82.3px]',
  'w-[108.8px]',
  'w-[136.4px]',
  'w-[75.9px]',
  'w-[80.8px]',
  'w-[106.2px]',
];

function SkeletonRow({
  label,
  bars,
  height,
}: {
  label: string;
  bars: string[];
  height: string;
}) {
  return (
    <div className={FILTER_ROW}>
      <div className={FILTER_LABEL}>
        <div className={`h-5.25 ${label} ${BAR}`} />
      </div>
      <div className="flex flex-wrap gap-2">
        {bars.map((width, index) => (
          <div key={index} className={`${height} ${width} ${BAR}`} />
        ))}
      </div>
    </div>
  );
}

// Heights mirror the chips, labels and selects
export function FilterSkeleton() {
  return (
    <div aria-hidden="true" className="border-b border-line">
      <SkeletonRow label="w-24" bars={COMPETITION_CHIPS} height="h-8.75" />
      <SkeletonRow label="w-10" bars={CLUB_CHIPS} height="h-8.75" />
      <SkeletonRow label="w-8" bars={['w-74']} height="h-9.25" />
    </div>
  );
}
