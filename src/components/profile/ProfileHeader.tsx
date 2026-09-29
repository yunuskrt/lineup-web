import { PROFILE_HEADING, PROFILE_TAG } from '@/components/profile/styles';
import type { User } from '@/types/user';

export function ProfileHeader({ user }: { user: User }) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className={`min-w-0 break-words ${PROFILE_HEADING}`}>
        {user.handle}
      </h1>
      {user.isGuest ? <span className={PROFILE_TAG}>Guest</span> : null}
    </header>
  );
}
