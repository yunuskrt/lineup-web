import { useId } from 'react';
import {
  PROFILE_PANEL,
  STAT_ROW,
  STAT_VALUE,
} from '@/components/profile/styles';
import { accuracyStat, favouriteClubStat, soloRunCount } from '@/lib/profile';
import type { UserStats } from '@/types/profile';

export function ProfileStats({ stats }: { stats: UserStats }) {
  const headingId = useId();
  const rows = [
    { label: 'Solo runs', value: String(soloRunCount(stats)) },
    { label: 'Perfect clears', value: String(stats.perfectClears) },
    { label: 'Best streak', value: String(stats.bestStreak) },
    { label: 'Accuracy', value: accuracyStat(stats) },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className={`${PROFILE_PANEL} px-4 py-1 sm:px-6 sm:py-3 lg:col-span-5`}
    >
      <h2 id={headingId} className="sr-only">
        Stats
      </h2>
      <dl className="sm:grid sm:grid-cols-2 sm:gap-x-6 lg:block">
        {rows.map(({ label, value }) => (
          <div key={label} className={STAT_ROW}>
            <dt className="text-14 leading-5 text-fg-muted">{label}</dt>
            <dd className={`text-fg ${STAT_VALUE}`}>{value}</dd>
          </div>
        ))}
        <div className={`${STAT_ROW} sm:col-span-2`}>
          <dt className="shrink-0 text-14 leading-5 text-fg-muted">
            Favourite club
          </dt>
          <dd
            className={`min-w-0 text-right break-words ${STAT_VALUE} ${
              stats.favouriteClub ? 'text-fg' : 'text-fg-muted'
            }`}
          >
            {favouriteClubStat(stats)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
