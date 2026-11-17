import { Check, Dumbbell, type LucideIcon, Swords, User } from 'lucide-react';
import { useId } from 'react';
import { ProLockCaption } from '@/components/pro/ProLock';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ACTOR_BAR,
  DUEL_ACTOR_BG,
  ICON_TILE,
  SECTION_LABEL,
  TYPE_TITLE,
} from '@/styles/classes';
import type { DuelActor } from '@/types/duel';
import type { ModeOption } from '@/types/play';
import type { ProAccess } from '@/types/pro';

type ModeChoiceProps = {
  // Null: nothing picked yet
  option: ModeOption | null;
  onChange: (option: ModeOption) => void;
  // Practice is Pro (R14); shown locked, never hidden
  practiceAccess: ProAccess;
  // A step heading already names the group
  isLegendHidden?: boolean;
};

type ModeCard = {
  option: ModeOption;
  title: string;
  text: string;
  icon: LucideIcon;
  players: DuelActor[];
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

const PRACTICE_CAPTION =
  'Practice is part of Pro: no clock, no lives, not saved.';

const CARD =
  'group flex flex-col gap-4 rounded-md border-2 border-line bg-surface-card p-5 sm:p-6';

// Full width under Solo and Duel until lg
const LAST_CARD = 'sm:col-span-2 lg:col-span-1';

const PICKABLE =
  'cursor-pointer text-fg hover:bg-surface has-checked:bg-brand has-checked:text-on-accent has-checked:shadow-hard has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus';

function CardIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden="true"
      className={`size-12 bg-surface-raised ${ICON_TILE}`}
    >
      <Icon className="size-6" strokeWidth={2.25} />
    </span>
  );
}

function PlayerBars({ players }: { players: DuelActor[] }) {
  return (
    <span aria-hidden="true" className="mt-auto flex gap-1.5">
      {players.map((player) => (
        <span
          key={player}
          className={`${ACTOR_BAR} ${DUEL_ACTOR_BG[player]}`}
        />
      ))}
    </span>
  );
}

type LockedCardProps = { card: ModeCard; name: string; isPending: boolean };

// Inert: a disabled radio, so arrows skip it
function LockedCard({ card, name, isPending }: LockedCardProps) {
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
}

export function ModeChoice({
  option,
  onChange,
  practiceAccess,
  isLegendHidden = false,
}: ModeChoiceProps) {
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
}
