'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/use-auth';
import { NAV_LINK } from '@/styles/classes';

export function NavAccount() {
  const pathname = usePathname();
  const session = useSession();

  if (session.isPending) {
    return (
      <div
        aria-hidden="true"
        className="h-5 w-16 rounded-sm bg-skeleton-fill"
      />
    );
  }

  const user = session.data?.user;
  if (user) {
    return (
      <Link
        href="/profile"
        title={user.handle}
        className={`block max-w-32 truncate sm:max-w-48 ${NAV_LINK}`}
      >
        {user.handle}
      </Link>
    );
  }

  if (pathname === '/sign-in') return null;

  return (
    <Link href="/sign-in" className={NAV_LINK}>
      Sign in
    </Link>
  );
}
