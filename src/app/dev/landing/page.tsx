import Link from 'next/link';
import { LandingStatePreview } from '@/components/dev/LandingStatePreview';
import { SiteFooter } from '@/components/shell/SiteFooter';
import {
  DEFAULT_LANDING_STATE,
  LANDING_STATES,
  resolveLandingState,
} from '@/lib/dev/landing-states';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';
import { SITE_CONTAINER, TEXT_LINK } from '@/styles/classes';

export const metadata = devMetadata('Landing');

export default async function LandingPreviewPage({
  searchParams,
}: PageProps<'/dev/landing'>) {
  requireDevEnv();
  const { state } = await searchParams;
  const name = typeof state === 'string' ? state : DEFAULT_LANDING_STATE;
  const resolved = resolveLandingState(state);

  return (
    <div className="flex min-h-full flex-col">
      <nav
        aria-label="Landing states"
        className={`${SITE_CONTAINER} flex flex-wrap gap-x-5 gap-y-2 border-b border-line py-4 text-14`}
      >
        {Object.keys(LANDING_STATES).map((key) => (
          <Link
            key={key}
            href={`/dev/landing?state=${key}`}
            aria-current={key === name ? 'page' : undefined}
            className={`${TEXT_LINK} aria-[current=page]:decoration-fg`}
          >
            {key}
          </Link>
        ))}
        <span className="text-fg-muted">{resolved.description}</span>
      </nav>
      <main className="flex flex-1 flex-col">
        <LandingStatePreview key={name} state={resolved} />
      </main>
      <SiteFooter variant="statement" />
    </div>
  );
}
