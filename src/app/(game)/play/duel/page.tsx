import type { Metadata } from 'next';
import { CanvasStatePreview } from '@/components/dev/CanvasStatePreview';
import { DuelGame } from '@/components/game/DuelGame';
import { ProtocolRefused } from '@/components/game/ProtocolRefused';
import { devOnlyParam } from '@/lib/dev/route';

const PROTOCOL_REFUSED_STATE = 'protocol-refused';

export const metadata: Metadata = {
  title: 'Duel',
};

export default async function DuelPage({
  searchParams,
}: PageProps<'/play/duel'>) {
  const state = devOnlyParam((await searchParams).state);

  // Not a canvas state: the refusal replaces it
  if (state === PROTOCOL_REFUSED_STATE) {
    return <ProtocolRefused backHref="/play?mode=duel" />;
  }

  if (state !== undefined) {
    return <CanvasStatePreview key={String(state)} mode="duel" state={state} />;
  }

  return <DuelGame />;
}
