'use client';

import React, { useState } from 'react';
import ProfileView from '@/components/profile/ProfileView';
import { resolveProfileState } from '@/lib/dev/profile-states';

type Props = {
  state?: string | string[];
};

export const ProfileStatePreview = ({ state }: Props) => {
  // Dates render after hydration, so SSR matches
  const [view] = useState(() => resolveProfileState(state).build(Date.now()));

  // Snapshots have no server to retry or page
  return <ProfileView view={view} onRetry={() => {}} onShowMore={() => {}} />;
};
