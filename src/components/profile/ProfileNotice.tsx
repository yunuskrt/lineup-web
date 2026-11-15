import Link from 'next/link';
import { TriangleAlert, UserRound } from 'lucide-react';
import {
  PRIMARY_BUTTON_LARGE,
  SECONDARY_BUTTON,
  TEXT_LINK,
} from '@/styles/classes';
import { StateNotice } from '@/components/shell/StateNotice';

type ProfileNoticeProps =
  | { kind: 'signedOut' }
  | { kind: 'error'; message: string; onRetry: () => void };

export function ProfileNotice(props: ProfileNoticeProps) {
  if (props.kind === 'error') {
    return (
      <StateNotice
        tone="error"
        icon={TriangleAlert}
        title="Couldn't load your profile"
        titleLevel={1}
        message={props.message}
      >
        <button
          type="button"
          onClick={props.onRetry}
          className={SECONDARY_BUTTON}
        >
          Try again
        </button>
      </StateNotice>
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
      <Link href="/sign-in" className={`text-14 ${TEXT_LINK}`}>
        Sign in
      </Link>
    </StateNotice>
  );
}
