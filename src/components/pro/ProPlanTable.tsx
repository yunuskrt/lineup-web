import { PROFILE_PANEL } from '@/components/profile/styles';

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

function Value({ value }: { value: string | null }) {
  if (value !== null) return value;
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not included</span>
    </>
  );
}

export function ProPlanTable() {
  return (
    <div className={PROFILE_PANEL}>
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">Free and Pro compared</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={`${CELL} w-[38%] font-normal`}>
              <span className="sr-only">Feature</span>
            </th>
            <th scope="col" className={`${CELL} font-semibold text-fg-muted`}>
              Free
            </th>
            <th scope="col" className={`${CELL} font-semibold text-brand`}>
              Pro
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr
              key={row.feature}
              className="border-b border-line last:border-b-0"
            >
              <th scope="row" className={`${CELL} font-medium text-fg`}>
                {row.feature}
              </th>
              <td className={`${CELL} text-fg-muted`}>
                <Value value={row.free} />
              </td>
              <td className={`${CELL} text-fg`}>
                <Value value={row.pro} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
