'use client';

import { ProfileView } from '@/components/profile/ProfileView';
import { useSession } from '@/hooks/use-auth';
import { useHistory, useProfile } from '@/hooks/use-profile';
import { profileScreenView } from '@/lib/profile';

export function ProfileScreen() {
  const session = useSession();
  const profile = useProfile();
  const history = useHistory();

  const view = profileScreenView({
    session,
    profile,
    history: { ...history, data: history.data?.pages },
  });

  function retry() {
    if (session.isError) void session.refetch();
    if (profile.isError && !profile.data) void profile.refetch();
    if (history.isError && !history.data) void history.refetch();
  }

  function showMore() {
    if (!history.isFetchingNextPage) void history.fetchNextPage();
  }

  return <ProfileView view={view} onRetry={retry} onShowMore={showMore} />;
}
