import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { HistoryEntry } from '@/types/profile';

const MODE_LABELS: Record<HistoryEntry['mode'], string> = {
  solo: 'Solo',
  duel: 'Duel',
};

type ModeKind = 'solo' | 'duel' | 'friend';

// Neither side's colour: a mode is not a side
const MODE_TONES = {
  solo: 'mint',
  duel: 'purple',
  friend: 'butter',
} as const;

function modeKind(entry: HistoryEntry): ModeKind {
  if (entry.mode === 'solo') return 'solo';
  return entry.isPrivate ? 'friend' : 'duel';
}

type Props = { entry: HistoryEntry };

// A private room's duel; the column fits one word
const ModeTag = ({ entry }: Props) => {
  const kind = modeKind(entry);
  return (
    <Badge
      variant="sticker"
      tone={MODE_TONES[kind]}
      tilt="none"
      // Narrow, so the phone row keeps its scoreline
      className="px-1.5 font-stretch-normal sm:col-start-1 sm:row-start-1 sm:justify-self-start"
    >
      {kind === 'friend' ? (
        <>
          <span aria-hidden="true">Friend</span>
          <span className="sr-only">Duel with a friend</span>
        </>
      ) : (
        MODE_LABELS[entry.mode]
      )}
    </Badge>
  );
};

export default ModeTag;
