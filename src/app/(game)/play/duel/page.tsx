import type { Metadata } from 'next';
import { CanvasStatePreview } from '@/components/dev/CanvasStatePreview';
import { devOnlyParam } from '@/lib/dev/route';

export const metadata: Metadata = {
  title: 'Duel',
};

// Loading canvas until the duel loop is wired
export default async function DuelPage({
  searchParams,
}: PageProps<'/play/duel'>) {
  const state = devOnlyParam((await searchParams).state);

  return <CanvasStatePreview key={String(state)} mode="duel" state={state} />;
}
