import type { PositionGroup } from '@/types/player';

const POSITION_NAMES: Record<PositionGroup, string> = {
  GK: 'Goalkeeper',
  DF: 'Defender',
  MF: 'Midfielder',
  FW: 'Forward',
};

const SLOT_BOX =
  'flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-sm border px-0.5 text-center text-12 @min-[560px]:h-16 @min-[560px]:text-14';

const POSITION_LABEL = 'text-12 leading-4 font-medium uppercase';

type SquadSlotProps = {
  position: PositionGroup;
} & ({ state: 'empty' } | { state: 'filled'; name: string });

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

  return (
    <div className={`${SLOT_BOX} border-line bg-surface-card`}>
      <span aria-hidden="true" className={`${POSITION_LABEL} text-fg-muted`}>
        {position}
      </span>
      <span
        aria-hidden="true"
        className="line-clamp-2 w-full leading-tight font-medium break-words hyphens-auto text-fg"
      >
        {props.name}
      </span>
      <span className="sr-only">
        {positionName}, {props.name}
      </span>
    </div>
  );
}
