import React from 'react';
import type { Metadata } from 'next';
import { CanvasStatePreview } from '@/components/dev/CanvasStatePreview';
import SoloGame from '@/components/game/SoloGame';
import { devOnlyParam } from '@/lib/dev/route';

export const metadata: Metadata = {
  title: 'Solo',
};

type Props = PageProps<'/play/solo'>;

const SoloPage = async ({ searchParams }: Props) => {
  const state = devOnlyParam((await searchParams).state);

  if (state !== undefined) {
    return <CanvasStatePreview key={String(state)} mode="solo" state={state} />;
  }

  return <SoloGame />;
};

export default SoloPage;
