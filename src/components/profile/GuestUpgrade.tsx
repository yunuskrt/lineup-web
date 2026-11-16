import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PRIMARY_BUTTON } from '@/styles/classes';

const GUEST_UPGRADE_HREF = '/sign-in?mode=sign-up';

export function GuestUpgrade() {
  return (
    <Alert tone="neutral">
      <UserRound aria-hidden="true" />
      <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="max-w-2xl">
          You&apos;re playing as a guest. Create an account to keep your history
          on any device. Nothing you&apos;ve played is lost.
        </p>
        <Link
          href={GUEST_UPGRADE_HREF}
          className={`shrink-0 ${PRIMARY_BUTTON}`}
        >
          Create account
        </Link>
      </AlertDescription>
    </Alert>
  );
}
