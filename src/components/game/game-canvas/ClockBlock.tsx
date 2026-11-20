import React from 'react';
import CountdownRing from '@/components/game/CountdownRing';
import { Badge } from '@/components/ui/badge';
import { activeRing, clockLabel } from '@/lib/canvas';
import type { CanvasView } from '@/types/canvas';

type Props = { view: CanvasView };

const ClockBlock = ({ view }: Props) => {
  const turn = view.mode === 'duel' ? view.turn : null;
  const ring = activeRing(view.clock, view.mode === 'duel' ? turn : 'you');
  const label = clockLabel(view.mode, turn);

  return (
    <div className="flex shrink-0 flex-col items-center gap-2 lg:-mx-4 lg:border-b-2 lg:border-line lg:px-4 lg:pb-4">
      {/* The duel sticker is the turn cue; keep it */}
      {label.actor ? (
        <span className="flex h-6 items-center">
          <Badge variant="sticker" tone={label.actor}>
            {label.text}
          </Badge>
        </span>
      ) : (
        <span
          className={`text-12 leading-6 font-medium text-fg-muted uppercase ${
            view.mode === 'solo' ? 'max-lg:hidden' : ''
          }`}
        >
          {label.text}
        </span>
      )}
      <CountdownRing round={ring.round} mode={ring.mode} owner={ring.owner} />
    </div>
  );
};

export default ClockBlock;
