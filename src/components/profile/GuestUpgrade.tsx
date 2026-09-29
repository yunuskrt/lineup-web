import Link from 'next/link';
import { PROFILE_PANEL } from '@/components/profile/styles';
import { PRIMARY_BUTTON } from '@/styles/classes';

const GUEST_UPGRADE_HREF = '/sign-in?mode=sign-up';

export function GuestUpgrade() {
  return (
    <div
      className={`${PROFILE_PANEL} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6`}
    >
      <p className="max-w-2xl text-14 leading-5 text-fg">
        You&apos;re playing as a guest. Create an account to keep your history
        on any device. Nothing you&apos;ve played is lost.
      </p>
      <Link
        href={GUEST_UPGRADE_HREF}
        className={`inline-flex h-8 shrink-0 items-center justify-center ${PRIMARY_BUTTON}`}
      >
        Create account
      </Link>
    </div>
  );
}
