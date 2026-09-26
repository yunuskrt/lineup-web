import Link from 'next/link';
import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { CANVAS_STATES } from '@/lib/dev/canvas-states';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';
import { FOCUS_RING } from '@/styles/classes';
import type { CanvasMode } from '@/types/canvas';

export const metadata = devMetadata('Canvas');

const SECTIONS: { mode: CanvasMode; title: string; route: string }[] = [
  { mode: 'solo', title: 'Solo', route: '/play/solo' },
  { mode: 'duel', title: 'Duel', route: '/play/duel' },
];

export default function CanvasStatesPage() {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Canvas"
      description="Dev-only index of every ?state= the game routes can render. States with a one-shot effect play it 600ms after load; reload to see it again. Guesses are ignored."
      isNarrow
    >
      {SECTIONS.map(({ mode, title, route }) => (
        <section key={mode} className="flex flex-col gap-4">
          <h2 className="font-display text-20 font-semibold">{title}</h2>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {Object.entries(CANVAS_STATES[mode]).map(([name, state]) => (
              <li key={name}>
                <Link
                  href={`${route}?state=${name}`}
                  className={`flex flex-col gap-1 py-3 hover:bg-surface-raised sm:flex-row sm:items-baseline sm:gap-6 ${FOCUS_RING}`}
                >
                  <span className="w-40 shrink-0 text-14 font-medium text-fg">
                    {name}
                  </span>
                  <span className="text-14 text-fg-muted">
                    {state.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </DevPreviewShell>
  );
}
