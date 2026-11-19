import React from 'react';
import DuelRecord from '@/components/profile/DuelRecord';
import GuestUpgrade from '@/components/profile/GuestUpgrade';
import HistoryList from '@/components/profile/HistoryList';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileNotice from '@/components/profile/ProfileNotice';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileStats from '@/components/profile/ProfileStats';
import { PROFILE_FIGURES } from '@/components/profile/styles';
import { BOARD, BOARD_SECTION } from '@/styles/classes';
import type { ProfileScreenView } from '@/types/profile-screen';

type Props = {
  view: ProfileScreenView;
  onRetry: () => void;
  onShowMore: () => void;
};

const ProfileView = ({ view, onRetry, onShowMore }: Props) => {
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
        <div className={BOARD}>
          <div className={BOARD_SECTION}>
            <ProfileHeader user={user} />
            {user.isGuest ? <GuestUpgrade /> : null}
          </div>
          <div className={PROFILE_FIGURES}>
            <DuelRecord stats={stats} />
            <ProfileStats stats={stats} />
          </div>
          <div className={BOARD_SECTION}>
            <HistoryList
              history={view.history}
              more={view.more}
              onShowMore={onShowMore}
            />
          </div>
        </div>
      );
    }
  }
};

export default ProfileView;
