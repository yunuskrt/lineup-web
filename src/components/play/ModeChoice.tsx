import React, { useId } from 'react';
import { Check, Dumbbell, Swords, User } from 'lucide-react';
import CardIcon from '@/components/play/mode-choice/CardIcon';
import LockedCard from '@/components/play/mode-choice/LockedCard';
import PlayerBars from '@/components/play/mode-choice/PlayerBars';
import type { ModeCard } from '@/components/play/mode-choice/shared';
import { CARD, LAST_CARD } from '@/components/play/mode-choice/styles';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SECTION_LABEL, TYPE_TITLE } from '@/styles/classes';
import type { ModeOption } from '@/types/play';
import type { ProAccess } from '@/types/pro';

type Props = {
  // Null: nothing picked yet
  option: ModeOption | null;
  onChange: (option: ModeOption) => void;
  // Practice is Pro (R14); shown locked, never hidden
  practiceAccess: ProAccess;
  // A step heading already names the group
  isLegendHidden?: boolean;
};

const MODES: ModeCard[] = [
  {
    option: 'solo',
    title: 'Solo',
    text: 'Just you and the clock. You pick home or away, and the run lasts until your lives are gone.',
    icon: User,
    players: ['you'],
  },
  {
    option: 'duel',
    title: 'Duel',
    text: 'Take turns with a live opponent on the same XI. Your filters and theirs go into a coin flip, and one set is used.',
    icon: Swords,
    players: ['you', 'opponent'],
  },
  {
    option: 'practice',
    title: 'Practice',
    text: "No clock and no lives. Name all eleven, or quit when you like. Practice runs aren't saved.",
    icon: Dumbbell,
    players: ['you'],
  },
];

const PICKABLE =
  'cursor-pointer text-fg hover:bg-surface has-checked:bg-brand has-checked:text-on-accent has-checked:shadow-hard has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus';

const ModeChoice = ({
  option,
  onChange,
  practiceAccess,
  isLegendHidden = false,
}: Props) => {
  // One group per instance, as the dev preview has three
  const name = useId();

  return (
    <fieldset>
      <legend className={isLegendHidden ? 'sr-only' : `mb-4 ${SECTION_LABEL}`}>
        Mode
      </legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((card) => {
          if (card.option === 'practice' && practiceAccess !== 'open') {
            return (
              <LockedCard
                key={card.option}
                card={card}
                name={name}
                isPending={practiceAccess === 'pending'}
              />
            );
          }
          const isSelected = option === card.option;
          return (
            <label
              key={card.option}
              className={cn(
                CARD,
                PICKABLE,
                card.option === 'practice' && LAST_CARD,
              )}
            >
              <input
                type="radio"
                name={name}
                value={card.option}
                checked={isSelected}
                onChange={() => onChange(card.option)}
                className="sr-only"
              />
              <span className="flex items-start justify-between gap-3">
                <CardIcon icon={card.icon} />
                {/* The radio's own state says it to readers */}
                {isSelected ? (
                  <Badge
                    aria-hidden="true"
                    variant="sticker"
                    tilt="right"
                    className="mt-1"
                  >
                    <Check strokeWidth={3} />
                    Selected
                  </Badge>
                ) : null}
              </span>
              <span className={TYPE_TITLE}>{card.title}</span>
              <span className="max-w-md text-16 text-pretty text-fg-muted group-has-checked:text-on-accent">
                {card.text}
              </span>
              <PlayerBars players={card.players} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default ModeChoice;
