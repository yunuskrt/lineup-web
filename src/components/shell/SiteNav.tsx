import React from 'react';
import Link from 'next/link';
import NavAccount from '@/components/shell/NavAccount';
import NavArchive from '@/components/shell/NavArchive';
import NavCta from '@/components/shell/NavCta';
import { FOCUS_RING, SITE_CONTAINER } from '@/styles/classes';

type Props = {};

const SiteNav = ({}: Props) => {
  return (
    <header className="border-b-2 border-line">
      <nav
        aria-label="Primary"
        className={`${SITE_CONTAINER} flex h-16 items-center justify-between gap-4`}
      >
        <Link
          href="/"
          className={`rounded-sm font-display text-20 font-black uppercase font-stretch-expanded ${FOCUS_RING}`}
        >
          Lineup
        </Link>
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <NavArchive />
          <NavAccount />
          <NavCta />
        </div>
      </nav>
    </header>
  );
};

export default SiteNav;
