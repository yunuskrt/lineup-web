'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/use-auth';
import { FOCUS_RING } from '@/styles/classes';

const NAV_LINK = `rounded-sm text-14 font-medium text-fg-muted hover:text-fg ${FOCUS_RING}`;

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
