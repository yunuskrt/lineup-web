import { useId } from 'react';
import {
  STAT_LABEL,
  STAT_TILE,
  STATS_BLOCK,
} from '@/components/profile/styles';
import { accuracyStat, soloRunCount } from '@/lib/profile';
import { TYPE_NUMBER } from '@/styles/classes';
import type { UserStats } from '@/types/profile';

export function ProfileStats({ stats }: { stats: UserStats }) {
  const headingId = useId();
  const tiles = [
    { label: 'Solo runs', value: String(soloRunCount(stats)) },
    { label: 'Perfect clears', value: String(stats.perfectClears) },
    { label: 'Best streak', value: String(stats.bestStreak) },
    { label: 'Accuracy', value: accuracyStat(stats) },
  ];

  return (
    <section aria-labelledby={headingId} className="flex lg:col-span-5">
      <h2 id={headingId} className="sr-only">
        Stats
      </h2>
      <dl className={`flex-1 ${STATS_BLOCK}`}>
        {tiles.map(({ label, value }) => (
          <div key={label} className={STAT_TILE}>
            <dt className={STAT_LABEL}>{label}</dt>
            <dd className={`text-28 leading-none ${TYPE_NUMBER}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
