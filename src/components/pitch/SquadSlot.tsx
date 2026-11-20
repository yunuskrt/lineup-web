import React, { type ReactNode } from 'react';
import PlayerHeadshot from '@/components/pitch/PlayerHeadshot';
import EmptyDisc from '@/components/pitch/squad-slot/EmptyDisc';
import { HEADSHOT_SIZE } from '@/components/pitch/styles';
import { SKELETON } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DUEL_ACTOR_BG } from '@/styles/classes';
import type { DuelActor } from '@/types/duel';
import type { PositionGroup } from '@/types/player';

const POSITION_NAMES: Record<PositionGroup, string> = {
  GK: 'Goalkeeper',
  DF: 'Defender',
  MF: 'Midfielder',
  FW: 'Forward',
};

const FINDER_NAMES: Record<DuelActor, string> = {
  you: 'named by you',
  opponent: 'named by your opponent',
};

// Solo labels stay white; the flash says "correct"
const LABEL_FILL: Record<DuelActor | 'solo', string> = {
  solo: 'bg-surface-card',
  ...DUEL_ACTOR_BG,
};

// Disc on top: SquadGrid anchors its foot to the spot
const SLOT_BOX =
  'relative flex w-full flex-col items-center gap-0.5 text-center @min-[480px]:gap-1';

const LABEL =
  'max-w-full rounded-sm border-2 px-0.5 py-px text-[11px] leading-none @min-[360px]:text-12 @min-[360px]:leading-[1.1] @min-[480px]:px-1 @min-[480px]:text-14';

const NAME = 'line-clamp-2 break-words hyphens-auto';

const POSITION_PILL = `${LABEL} rounded-full px-1.5 font-semibold uppercase`;

type Props = {
  position: PositionGroup;
} & (
  | { state: 'loading' }
  | { state: 'empty' }
  // Shown once the run is over, if the server sent it
  | { state: 'missed'; name: string; imageUrl: string | null }
  | {
      state: 'filled';
      name: string;
      imageUrl: string | null;
      foundBy?: DuelActor;
      // Painted under the slot, e.g. the reveal flash
      backdrop?: ReactNode;
    }
);

const SquadSlot = (props: Props) => {
  const { position } = props;
  const positionName = POSITION_NAMES[position];

  if (props.state === 'loading') {
    return (
      <div aria-hidden="true" className={SLOT_BOX}>
        <span className={cn(SKELETON, 'rounded-full', HEADSHOT_SIZE)} />
        <span className={cn(SKELETON, 'h-4 w-3/4 rounded-full')} />
      </div>
    );
  }

  if (props.state === 'empty') {
    return (
      <div className={SLOT_BOX}>
        <EmptyDisc />
        <span
          aria-hidden="true"
          className={`${POSITION_PILL} border-line bg-surface-card text-fg-muted`}
        >
          {position}
        </span>
        <span className="sr-only">{positionName}, not yet named</span>
      </div>
    );
  }

  if (props.state === 'missed') {
    return (
      <div className={SLOT_BOX}>
        <PlayerHeadshot
          name={props.name}
          imageUrl={props.imageUrl}
          className="border-dashed border-fg-muted opacity-60"
        />
        <span
          aria-hidden="true"
          className={`${LABEL} ${NAME} border-dashed border-fg-muted bg-turf font-medium text-fg-muted`}
        >
          {props.name}
        </span>
        <span className="sr-only">
          {positionName}, {props.name}, missed
        </span>
      </div>
    );
  }

  const { name, imageUrl, foundBy, backdrop } = props;
  const finder = foundBy ? `, ${FINDER_NAMES[foundBy]}` : '';

  return (
    <div className={SLOT_BOX}>
      {backdrop}
      <PlayerHeadshot
        name={name}
        imageUrl={imageUrl}
        foundBy={foundBy}
        className="relative"
      />
      <span
        aria-hidden="true"
        className={`relative ${LABEL} ${NAME} border-line font-semibold text-on-accent shadow-hard-sm ${LABEL_FILL[foundBy ?? 'solo']}`}
      >
        {name}
      </span>
      <span className="sr-only">
        {positionName}, {name}
        {finder}
      </span>
    </div>
  );
};

export default SquadSlot;
