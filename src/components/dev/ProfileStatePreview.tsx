'use client';

import { useState } from 'react';
import { ProfileView } from '@/components/profile/ProfileView';
import { resolveProfileState } from '@/lib/dev/profile-states';

type ProfileStatePreviewProps = {
  state?: string | string[];
};

export function ProfileStatePreview({ state }: ProfileStatePreviewProps) {
  // Dates render after hydration, so SSR matches
  const [view] = useState(() => resolveProfileState(state).build(Date.now()));

  // Snapshots have no server to retry or page
  return <ProfileView view={view} onRetry={() => {}} onShowMore={() => {}} />;
}
