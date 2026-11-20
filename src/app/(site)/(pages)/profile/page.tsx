import React from 'react';
import type { Metadata } from 'next';
import { ProfileStatePreview } from '@/components/dev/ProfileStatePreview';
import ProfileScreen from '@/components/profile/ProfileScreen';
import { devOnlyParam } from '@/lib/dev/route';
import { SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Profile',
};

type Props = PageProps<'/profile'>;

const ProfilePage = async ({ searchParams }: Props) => {
  const state = devOnlyParam((await searchParams).state);

  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      {state !== undefined ? (
        <ProfileStatePreview key={String(state)} state={state} />
      ) : (
        <ProfileScreen />
      )}
    </div>
  );
};

export default ProfilePage;
