import { GetProButton } from '@/components/pro/GetProButton';
import { ProPlanTable } from '@/components/pro/ProPlanTable';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BOARD, BOARD_SECTION, TYPE_TITLE } from '@/styles/classes';

// Pending: the session isn't known yet
export type ProPlan = 'pending' | 'free' | 'pro';

export function ProView({ plan }: { plan: ProPlan }) {
  return (
    <div className={BOARD}>
      <header className={cn(BOARD_SECTION, 'gap-2')}>
        <h1 className={TYPE_TITLE}>Lineup Pro</h1>
        <p className="max-w-xl text-16 leading-6 text-pretty text-fg-muted sm:text-20 sm:leading-7">
          More solo: pick any match, practise it, play without a daily limit.
        </p>
      </header>
      <div className={BOARD_SECTION}>
        <ProPlanTable />
      </div>
      {/* Same height in every plan, so nothing shifts */}
      <div className={BOARD_SECTION}>
        <div className="min-h-19">
          {plan === 'free' ? <GetProButton /> : null}
          {plan === 'pro' ? (
            <Badge role="status" variant="sticker" tone="brand">
              You have Pro.
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
