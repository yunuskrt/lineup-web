import Link from 'next/link';
import { SITE_CONTAINER, TEXT_LINK } from '@/styles/classes';

type SiteFooterProps = {
  variant: 'statement' | 'inline';
};

export function SiteFooter({ variant }: SiteFooterProps) {
  if (variant === 'statement') {
    return (
      <footer className="border-t border-line">
        <div
          className={`${SITE_CONTAINER} flex flex-col items-start gap-4 py-16 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8`}
        >
          <p className="font-display text-24 font-bold uppercase font-stretch-expanded sm:text-32">
            Eleven names. Fifteen seconds.
          </p>
          <Link href="/play" className={`shrink-0 text-16 ${TEXT_LINK}`}>
            Play
          </Link>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-line">
      <p className={`${SITE_CONTAINER} py-6 text-12 text-fg-muted`}>
        Lineup — Know the XI. Beat the Clock.
      </p>
    </footer>
  );
}
