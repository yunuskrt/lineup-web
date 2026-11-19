import React, { useId } from 'react';
import LetterTile, {
  type Tile,
} from '@/components/profile/duel-record/LetterTile';
import {
  RECORD_BAR,
  RECORD_BLOCK,
  RECORD_HEADER,
  RECORD_NUMERAL,
} from '@/components/profile/styles';
import { duelCountLabel, duelRecord, recordShares } from '@/lib/profile';
import { cn } from '@/lib/utils';
import type { UserStats } from '@/types/profile';

type Props = { stats: UserStats };

const DuelRecord = ({ stats }: Props) => {
  const headingId = useId();
  const record = duelRecord(stats);
  const shares = recordShares(stats);
  const hasDuels = record.total > 0;
  const counts: { label: string; value: number; tile: Tile }[] = [
    { label: 'Won', value: record.wins, tile: 'win' },
    { label: 'Drawn', value: record.draws, tile: 'draw' },
    { label: 'Lost', value: record.losses, tile: 'loss' },
  ];
  const segments = [
    { key: 'wins', share: shares.wins, fill: 'bg-you' },
    { key: 'draws-you', share: shares.draws / 2, fill: 'bg-you' },
    { key: 'draws-opponent', share: shares.draws / 2, fill: 'bg-opponent' },
    { key: 'losses', share: shares.losses, fill: 'bg-danger' },
  ].filter(({ share }) => share > 0);

  return (
    <section aria-labelledby={headingId} className={RECORD_BLOCK}>
      <div className={RECORD_HEADER}>
        <h2 id={headingId} className="text-14 leading-5 font-semibold">
          Duel record
        </h2>
        <p className="text-14 leading-5 tabular-nums">
          {duelCountLabel(record.total)}
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-4">
        {counts.map(({ label, value, tile }) => (
          <div key={label} className="flex min-w-0 flex-col gap-2">
            <dt className="flex items-center gap-1.5 text-12 leading-4 font-medium uppercase">
              <LetterTile tile={tile} isMuted={!hasDuels} />
              {label}
            </dt>
            <dd className={RECORD_NUMERAL}>{value}</dd>
          </div>
        ))}
      </dl>
      {/* Ink gaps split the segments; none yet is white */}
      <div
        aria-hidden="true"
        className={cn(
          'mt-auto',
          RECORD_BAR,
          hasDuels ? 'bg-line' : 'bg-surface-card',
        )}
      >
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
};

export default DuelRecord;
