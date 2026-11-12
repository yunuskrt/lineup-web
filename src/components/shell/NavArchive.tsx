'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ARCHIVE_PATH } from '@/lib/archive';
import { NAV_LINK } from '@/styles/classes';

// For everyone: the page itself shows any lock
export function NavArchive() {
  const pathname = usePathname();

  return (
    <Link
      href={ARCHIVE_PATH}
      aria-current={pathname === ARCHIVE_PATH ? 'page' : undefined}
      className={`shrink-0 ${NAV_LINK}`}
    >
      Archive
    </Link>
  );
}
