import type { Metadata } from 'next';
import { CanvasStatePreview } from '@/components/dev/CanvasStatePreview';
import { devOnlyParam } from '@/lib/dev/route';

export const metadata: Metadata = {
  title: 'Solo',
};

// Loading canvas until the solo loop is wired
export default async function SoloPage({
  searchParams,
}: PageProps<'/play/solo'>) {
  const state = devOnlyParam((await searchParams).state);

  return <CanvasStatePreview key={String(state)} mode="solo" state={state} />;
}
