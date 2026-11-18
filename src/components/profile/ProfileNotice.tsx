import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { PRIMARY_BUTTON_LARGE, SECONDARY_BUTTON_LARGE } from '@/styles/classes';
import RetryNotice from '@/components/shell/RetryNotice';
import StateNotice from '@/components/shell/StateNotice';

type ProfileNoticeProps =
  | { kind: 'signedOut' }
  | { kind: 'error'; message: string; onRetry: () => void };

export function ProfileNotice(props: ProfileNoticeProps) {
  if (props.kind === 'error') {
    return (
      <RetryNotice
        title="Couldn't load your profile"
        titleLevel={1}
        message={props.message}
        onRetry={props.onRetry}
      />
    );
  }

  return (
    <StateNotice
      tone="info"
      icon={UserRound}
      title="No profile yet"
      titleLevel={1}
      message="Play a game and your history starts here. No account needed."
    >
      <Link href="/play" className={PRIMARY_BUTTON_LARGE}>
        Play
      </Link>
      <Link href="/sign-in" className={SECONDARY_BUTTON_LARGE}>
        Sign in
      </Link>
    </StateNotice>
  );
}
