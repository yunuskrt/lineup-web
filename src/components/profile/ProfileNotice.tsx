import Link from 'next/link';
import { PROFILE_HEADING } from '@/components/profile/styles';
import {
  PRIMARY_BUTTON_LARGE,
  SECONDARY_BUTTON,
  TEXT_LINK,
} from '@/styles/classes';

type ProfileNoticeProps =
  | { kind: 'signedOut' }
  | { kind: 'error'; message: string; onRetry: () => void };

export function ProfileNotice(props: ProfileNoticeProps) {
  if (props.kind === 'error') {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className={PROFILE_HEADING}>Couldn&apos;t load your profile</h1>
        <p role="alert" className="text-16 leading-6 text-danger">
          {props.message}
        </p>
        <button
          type="button"
          onClick={props.onRetry}
          className={SECONDARY_BUTTON}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col items-start gap-6">
      <div className="flex flex-col gap-2">
        <h1 className={PROFILE_HEADING}>No profile yet</h1>
        <p className="text-16 leading-6 text-fg-muted">
          Play a game and your history starts here. No account needed.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Link href="/play" className={PRIMARY_BUTTON_LARGE}>
          Play
        </Link>
        <Link href="/sign-in" className={`text-14 ${TEXT_LINK}`}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
