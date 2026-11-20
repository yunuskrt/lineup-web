import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProScreen from '@/components/pro/ProScreen';
import { isProSwitchOff } from '@/lib/api/pro-switch';
import { SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Pro',
};

type Props = {};

// A real 404 while the split is off (backend R9)
const ProPage = async ({}: Props) => {
  if (await isProSwitchOff()) notFound();

  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      <ProScreen />
    </div>
  );
};

export default ProPage;
