import { useId } from 'react';
import {
  PANEL_HEADER,
  PROFILE_PANEL,
  RECORD_BAR,
  RECORD_NUMERAL,
} from '@/components/profile/styles';
import { duelCountLabel, duelRecord, recordShares } from '@/lib/profile';
import type { UserStats } from '@/types/profile';

export function DuelRecord({ stats }: { stats: UserStats }) {
  const headingId = useId();
  const record = duelRecord(stats);
  const shares = recordShares(stats);
  const hasDuels = record.total > 0;
  // Coloured zeros would read as a result
  const counts = [
    { label: 'Won', value: record.wins, tone: 'text-you' },
    { label: 'Drawn', value: record.draws, tone: 'text-fg' },
    { label: 'Lost', value: record.losses, tone: 'text-danger' },
  ].map((count) => ({
    ...count,
    tone: hasDuels ? count.tone : 'text-fg-dim',
  }));
  // A draw is shared, so it shows both colours
  const segments = [
    { key: 'wins', share: shares.wins, fill: 'bg-you' },
    { key: 'draws-you', share: shares.draws / 2, fill: 'bg-you' },
    { key: 'draws-opponent', share: shares.draws / 2, fill: 'bg-opponent' },
    { key: 'losses', share: shares.losses, fill: 'bg-danger' },
  ].filter(({ share }) => share > 0);

  return (
    <section
      aria-labelledby={headingId}
      className={`${PROFILE_PANEL} flex flex-col gap-6 p-4 sm:p-6 lg:col-span-7`}
    >
      <div className={PANEL_HEADER}>
        <h2 id={headingId} className="text-14 leading-5 font-semibold">
          Duel record
        </h2>
        <p className="text-14 leading-5 text-fg-muted tabular-nums">
          {duelCountLabel(record.total)}
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-4">
        {counts.map(({ label, value, tone }) => (
          <div
            key={label}
            className="flex flex-col-reverse items-center gap-1 sm:items-start"
          >
            <dt className="text-12 leading-4 font-medium text-fg-muted">
              {label}
            </dt>
            <dd className={`${RECORD_NUMERAL} ${tone}`}>{value}</dd>
          </div>
        ))}
      </dl>
      <div aria-hidden="true" className={`mt-auto ${RECORD_BAR}`}>
        {segments.map(({ key, share, fill }) => (
          <span
            key={key}
            className={fill}
            // Grows into the space the gaps leave
            style={{ flex: `${share} 0 0` }}
          />
        ))}
      </div>
    </section>
  );
}
