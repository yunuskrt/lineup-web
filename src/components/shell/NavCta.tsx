'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_BUTTON } from '@/styles/classes';

type Props = {};

const NavCta = ({}: Props) => {
  const pathname = usePathname();

  // One primary action per view on /play
  if (pathname === '/play') return null;

  return (
    <Link href="/play" className={`shrink-0 ${PRIMARY_BUTTON}`}>
      Play
    </Link>
  );
};

export default NavCta;
