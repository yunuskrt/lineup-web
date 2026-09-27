import type { Metadata } from 'next';
import { CanvasStatePreview } from '@/components/dev/CanvasStatePreview';
import { SoloGame } from '@/components/game/SoloGame';
import { devOnlyParam } from '@/lib/dev/route';

export const metadata: Metadata = {
  title: 'Solo',
};

export default async function SoloPage({
  searchParams,
}: PageProps<'/play/solo'>) {
  const state = devOnlyParam((await searchParams).state);

  if (state !== undefined) {
    return <CanvasStatePreview key={String(state)} mode="solo" state={state} />;
  }

  return <SoloGame />;
}
