'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_BUTTON } from '@/styles/classes';

export function NavCta() {
  const pathname = usePathname();

  // One primary action per view on /play
  if (pathname === '/play') return null;

  return (
    <Link href="/play" className={`shrink-0 ${PRIMARY_BUTTON}`}>
      Play
    </Link>
  );
}
