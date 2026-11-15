import { TimerOff } from 'lucide-react';
import { RAIL_SECTION, TYPE_CARD_TITLE } from '@/styles/classes';

// Where the ring and the lives sit in a timed run
export function PracticeCard() {
  return (
    <section
      aria-label="Practice"
      className={`flex items-start gap-3 border-b-2 border-line pb-3 sm:pb-4 ${RAIL_SECTION}`}
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-md border-2 border-line bg-block-mint"
      >
        <TimerOff strokeWidth={2.5} className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className={TYPE_CARD_TITLE}>Practice</h2>
        <p className="text-14 leading-5 text-fg-muted">
          No clock and no lives. Name all eleven, or quit when you like. This
          run isn&apos;t saved.
        </p>
      </div>
    </section>
  );
}
