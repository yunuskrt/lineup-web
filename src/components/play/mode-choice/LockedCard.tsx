import React, { useId } from 'react';
import CardIcon from '@/components/play/mode-choice/CardIcon';
import PlayerBars from '@/components/play/mode-choice/PlayerBars';
import type { ModeCard } from '@/components/play/mode-choice/shared';
import { CARD, LAST_CARD } from '@/components/play/mode-choice/styles';
import ProLockCaption from '@/components/pro/ProLockCaption';
import { cn } from '@/lib/utils';
import { TYPE_TITLE } from '@/styles/classes';

const PRACTICE_CAPTION =
  'Practice is part of Pro: no clock, no lives, not saved.';

type Props = { card: ModeCard; name: string; isPending: boolean };

// Inert: a disabled radio, so arrows skip it
const LockedCard = ({ card, name, isPending }: Props) => {
  const titleId = useId();
  const captionId = useId();

  return (
    <div className={cn(CARD, LAST_CARD, 'cursor-not-allowed text-fg-muted')}>
      <input
        type="radio"
        name={name}
        value={card.option}
        disabled
        aria-labelledby={titleId}
        aria-describedby={isPending ? undefined : captionId}
        className="sr-only"
      />
      <CardIcon icon={card.icon} />
      <span id={titleId} className={TYPE_TITLE}>
        {card.title}
      </span>
      {isPending ? null : (
        <ProLockCaption id={captionId} caption={PRACTICE_CAPTION} />
      )}
      <PlayerBars players={card.players} />
    </div>
  );
};

export default LockedCard;
