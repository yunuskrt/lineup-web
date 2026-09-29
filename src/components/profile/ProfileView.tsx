import { DuelRecord } from '@/components/profile/DuelRecord';
import { GuestUpgrade } from '@/components/profile/GuestUpgrade';
import { HistoryList } from '@/components/profile/HistoryList';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileNotice } from '@/components/profile/ProfileNotice';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { ProfileStats } from '@/components/profile/ProfileStats';
import type { ProfileScreenView } from '@/types/profile-screen';

type ProfileViewProps = {
  view: ProfileScreenView;
  onRetry: () => void;
  onShowMore: () => void;
};

export function ProfileView({ view, onRetry, onShowMore }: ProfileViewProps) {
  switch (view.status) {
    case 'loading':
      return <ProfileSkeleton isGuest={view.isGuest} />;
    case 'signedOut':
      return <ProfileNotice kind="signedOut" />;
    case 'error':
      return (
        <ProfileNotice kind="error" message={view.message} onRetry={onRetry} />
      );
    case 'ready': {
      const { user, stats } = view.profile;
      return (
        <div className="flex flex-col gap-6">
          <ProfileHeader user={user} />
          {user.isGuest ? <GuestUpgrade /> : null}
          <div className="grid gap-6 lg:grid-cols-12">
            <DuelRecord stats={stats} />
            <ProfileStats stats={stats} />
          </div>
          <HistoryList
            history={view.history}
            more={view.more}
            onShowMore={onShowMore}
          />
        </div>
      );
    }
  }
}
