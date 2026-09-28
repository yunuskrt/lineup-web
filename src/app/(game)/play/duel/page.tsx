import type { Metadata } from 'next';
import { CanvasStatePreview } from '@/components/dev/CanvasStatePreview';
import { DuelGame } from '@/components/game/DuelGame';
import { devOnlyParam } from '@/lib/dev/route';

export const metadata: Metadata = {
  title: 'Duel',
};

export default async function DuelPage({
  searchParams,
}: PageProps<'/play/duel'>) {
  const state = devOnlyParam((await searchParams).state);

  if (state !== undefined) {
    return <CanvasStatePreview key={String(state)} mode="duel" state={state} />;
  }

  return <DuelGame />;
}
