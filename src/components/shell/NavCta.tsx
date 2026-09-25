'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FOCUS_RING } from '@/styles/classes';

export function NavCta() {
  const pathname = usePathname();

  // One primary action per view on /play
  if (pathname === '/play') return null;

  return (
    <Link
      href="/play"
      className={`rounded-sm bg-brand px-4 py-2 text-14 font-semibold text-on-accent ${FOCUS_RING}`}
    >
      Play
    </Link>
  );
}
