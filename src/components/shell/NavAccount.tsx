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
        className="size-6 rounded-sm bg-skeleton-fill sm:h-5 sm:w-16"
      />
    );
  }

  const user = session.data?.user;
  if (user) {
    return (
      // Phones: an icon, the handle kept as its name
      <Link
        href="/profile"
        title={user.handle}
        className={`block max-sm:p-0.5 sm:max-w-48 sm:truncate ${NAV_LINK}`}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          className="size-5 fill-none stroke-current stroke-[1.75] sm:hidden"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
        </svg>
        <span className="max-sm:sr-only">{user.handle}</span>
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
