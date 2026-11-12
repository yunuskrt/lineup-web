import { GetProButton } from '@/components/pro/GetProButton';
import { ProPlanTable } from '@/components/pro/ProPlanTable';
import { PROFILE_HEADING } from '@/components/profile/styles';

// Pending: the session isn't known yet
export type ProPlan = 'pending' | 'free' | 'pro';

export function ProView({ plan }: { plan: ProPlan }) {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className={`${PROFILE_HEADING} sm:text-48 sm:leading-12`}>
          Lineup Pro
        </h1>
        <p className="max-w-xl text-16 leading-6 text-pretty text-fg-muted sm:text-20 sm:leading-7">
          More solo: pick any match, practise it, play without a daily limit.
        </p>
      </div>
      <ProPlanTable />
      {/* Same height in every plan, so nothing shifts */}
      <div className="min-h-19">
        {plan === 'free' ? <GetProButton /> : null}
        {plan === 'pro' ? (
          <p role="status" className="text-16 leading-6 font-semibold text-fg">
            You have Pro.
          </p>
        ) : null}
      </div>
    </div>
  );
}
