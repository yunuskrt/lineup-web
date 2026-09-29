import type { Metadata } from 'next';
import { ProfileStatePreview } from '@/components/dev/ProfileStatePreview';
import { devOnlyParam } from '@/lib/dev/route';
import { SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Profile',
};

export default async function ProfilePage({
  searchParams,
}: PageProps<'/profile'>) {
  const state = devOnlyParam((await searchParams).state);

  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      {state !== undefined ? (
        <ProfileStatePreview key={String(state)} state={state} />
      ) : (
        <h1 className="font-display text-32 font-bold">Profile</h1>
      )}
    </div>
  );
}
