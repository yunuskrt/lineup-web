import React from 'react';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import ArchiveScreen from '@/components/archive/ArchiveScreen';
import { ArchiveStatePreview } from '@/components/dev/ArchiveStatePreview';
import { devOnlyParam } from '@/lib/dev/route';
import { SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Archive',
};

type Props = PageProps<'/archive'>;

const ArchivePage = async ({ searchParams }: Props) => {
  // Renders per request so the screen reads the URL
  await connection();
  const state = devOnlyParam((await searchParams).state);

  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      {state !== undefined ? (
        <ArchiveStatePreview key={String(state)} state={state} />
      ) : (
        <ArchiveScreen />
      )}
    </div>
  );
};

export default ArchivePage;
