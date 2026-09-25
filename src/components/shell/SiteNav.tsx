import Link from 'next/link';
import { NavCta } from '@/components/shell/NavCta';
import { FOCUS_RING, SITE_CONTAINER } from '@/styles/classes';

export function SiteNav() {
  return (
    <header className="border-b border-line">
      <nav
        aria-label="Primary"
        className={`${SITE_CONTAINER} flex h-16 items-center justify-between`}
      >
        <Link
          href="/"
          className={`rounded-sm font-display text-20 font-bold uppercase font-stretch-expanded ${FOCUS_RING}`}
        >
          Lineup
        </Link>
        <NavCta />
      </nav>
    </header>
  );
}
