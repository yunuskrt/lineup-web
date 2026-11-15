import Link from 'next/link';
import {
  PRIMARY_BUTTON_LARGE,
  SITE_CONTAINER,
  TYPE_SECTION,
} from '@/styles/classes';

type SiteFooterProps = {
  variant: 'statement' | 'inline';
};

export function SiteFooter({ variant }: SiteFooterProps) {
  if (variant === 'statement') {
    return (
      <footer className="border-t border-rule">
        <div
          className={`${SITE_CONTAINER} flex flex-col items-start gap-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:gap-8`}
        >
          <p className={TYPE_SECTION}>Eleven names. Fifteen seconds.</p>
          <Link href="/play" className={`shrink-0 ${PRIMARY_BUTTON_LARGE}`}>
            Play
          </Link>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-rule">
      <p className={`${SITE_CONTAINER} py-6 text-12 text-fg-muted`}>
        Lineup — Know the XI. Beat the Clock.
      </p>
    </footer>
  );
}
