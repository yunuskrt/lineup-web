import type { ReactNode } from 'react';
import { initials } from '@/lib/initials';
import type { DuelActor } from '@/types/duel';
import type { PositionGroup } from '@/types/player';

const POSITION_NAMES: Record<PositionGroup, string> = {
  GK: 'Goalkeeper',
  DF: 'Defender',
  MF: 'Midfielder',
  FW: 'Forward',
};

const FINDER_BADGE: Record<DuelActor, string> = {
  you: 'bg-you',
  opponent: 'bg-opponent',
};

const FINDER_NAMES: Record<DuelActor, string> = {
  you: 'named by you',
  opponent: 'named by your opponent',
};

const SLOT_BOX =
  'flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-sm border px-0.5 text-center text-12 @min-[560px]:h-16 @min-[560px]:text-14';

const POSITION_LABEL = 'text-12 leading-4 font-medium uppercase';

type SquadSlotProps = {
  position: PositionGroup;
} & (
  | { state: 'empty' }
  | {
      state: 'filled';
      name: string;
      foundBy?: DuelActor;
      // Painted under the text, e.g. the reveal flash
      backdrop?: ReactNode;
    }
);

export function SquadSlot(props: SquadSlotProps) {
  const { position } = props;
  const positionName = POSITION_NAMES[position];

  if (props.state === 'empty') {
    return (
      <div className={`${SLOT_BOX} border-marking bg-surface`}>
        <span aria-hidden="true" className={`${POSITION_LABEL} text-fg-dim`}>
          {position}
        </span>
        <span className="sr-only">{positionName}, not yet named</span>
      </div>
    );
  }

  const { name, foundBy, backdrop } = props;
  const finder = foundBy ? `, ${FINDER_NAMES[foundBy]}` : '';

  return (
    <div
      className={`relative overflow-hidden ${SLOT_BOX} border-line bg-surface-card`}
    >
      {backdrop}
      <span aria-hidden="true" className="relative flex items-center gap-1">
        <span
          className={`rounded-sm px-1 text-12 leading-4 font-semibold text-on-accent ${
            FINDER_BADGE[foundBy ?? 'you']
          }`}
        >
          {initials(name)}
        </span>
        <span className={`${POSITION_LABEL} text-fg-muted`}>{position}</span>
      </span>
      <span
        aria-hidden="true"
        className="relative line-clamp-2 w-full leading-tight font-medium break-words hyphens-auto text-fg"
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
