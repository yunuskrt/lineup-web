import type { ReactNode } from 'react';
import {
  HEADSHOT_SIZE,
  PlayerHeadshot,
} from '@/components/pitch/PlayerHeadshot';
import { PERSON_PATH } from '@/components/pitch/person';
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

// Each height clears the densest formation's lines
const SLOT_BOX =
  'flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-sm border px-0.5 text-center text-12 @min-[480px]:h-20 @min-[480px]:gap-1 @min-[480px]:text-14 @min-[560px]:h-24';

const POSITION_LABEL = 'text-12 leading-4 font-medium uppercase';

const NAME = 'line-clamp-2 w-full leading-tight break-words hyphens-auto';

type SquadSlotProps = {
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
      // Painted under the text, e.g. the reveal flash
      backdrop?: ReactNode;
    }
);

function EmptyDisc() {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border border-marking ${HEADSHOT_SIZE}`}
    >
      <svg viewBox="0 0 24 24" focusable="false" className="size-3/5">
        <path d={PERSON_PATH} className="fill-fg-dim" />
      </svg>
    </span>
  );
}

export function SquadSlot(props: SquadSlotProps) {
  const { position } = props;
  const positionName = POSITION_NAMES[position];

  if (props.state === 'loading') {
    return (
      <div
        aria-hidden="true"
        className={`${SLOT_BOX} border-skeleton-fill bg-skeleton-fill`}
      />
    );
  }

  if (props.state === 'empty') {
    return (
      <div className={`${SLOT_BOX} border-marking bg-surface`}>
        <EmptyDisc />
        <span aria-hidden="true" className={`${POSITION_LABEL} text-fg-dim`}>
          {position}
        </span>
        <span className="sr-only">{positionName}, not yet named</span>
      </div>
    );
  }

  if (props.state === 'missed') {
    return (
      <div className={`${SLOT_BOX} border-marking bg-surface`}>
        <PlayerHeadshot
          name={props.name}
          imageUrl={props.imageUrl}
          className="opacity-60"
        />
        <span
          aria-hidden="true"
          className={`${NAME} font-medium text-fg-muted`}
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
    <div
      className={`relative overflow-hidden ${SLOT_BOX} border-line bg-surface-card`}
    >
      {backdrop}
      <PlayerHeadshot
        name={name}
        imageUrl={imageUrl}
        foundBy={foundBy}
        className="relative"
      />
      <span
        aria-hidden="true"
        className={`relative ${NAME} font-medium text-fg`}
      >
        {name}
      </span>
      <span className="sr-only">
        {positionName}, {name}
        {finder}
      </span>
    </div>
  );
}
