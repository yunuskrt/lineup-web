import React from 'react';
import Value from '@/components/pro/pro-plan-table/Value';

// The Free vs Pro rows of project-overview.md
const ROWS: { feature: string; free: string | null; pro: string | null }[] = [
  { feature: '1v1 duels', free: 'Unlimited', pro: 'Unlimited' },
  { feature: 'Solo runs', free: '5 a day', pro: 'Unlimited' },
  { feature: 'Pick the exact match', free: null, pro: 'Any match' },
  { feature: 'Archive browse and search', free: null, pro: 'Every match' },
  { feature: 'Practice mode', free: null, pro: 'No clock, no lives' },
  {
    feature: 'Post-game review',
    free: 'How many you missed',
    pro: 'Every player you missed',
  },
  { feature: 'Private rooms', free: 'Join', pro: 'Host and join' },
];

const CELL = 'px-3 py-3 align-top text-14 leading-5 sm:px-6';

// The Pro column, filled so it reads as the offer
const PRO_CELL = `${CELL} bg-block-lavender text-on-accent`;

type Props = {};

const ProPlanTable = ({}: Props) => {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-line bg-surface-card">
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">Free and Pro compared</caption>
        <thead>
          <tr className="border-b-2 border-line">
            <th scope="col" className={`${CELL} w-[38%] font-normal`}>
              <span className="sr-only">Feature</span>
            </th>
            <th scope="col" className={`${CELL} font-semibold text-fg-muted`}>
              Free
            </th>
            <th scope="col" className={`${PRO_CELL} font-semibold`}>
              Pro
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr
              key={row.feature}
              className="border-b-2 border-line last:border-b-0"
            >
              <th scope="row" className={`${CELL} font-medium text-fg`}>
                {row.feature}
              </th>
              <td className={`${CELL} text-fg-muted`}>
                <Value value={row.free} isPro={false} />
              </td>
              <td className={PRO_CELL}>
                <Value value={row.pro} isPro />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProPlanTable;
