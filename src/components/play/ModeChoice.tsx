import { Check, type LucideIcon, Swords, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ACTOR_BAR,
  DUEL_ACTOR_BG,
  ICON_TILE,
  SECTION_LABEL,
  TYPE_TITLE,
} from '@/styles/classes';
import type { DuelActor } from '@/types/duel';
import type { PlayMode } from '@/types/play';

type ModeChoiceProps = {
  mode: PlayMode;
  onChange: (mode: PlayMode) => void;
};

const MODES: {
  mode: PlayMode;
  title: string;
  text: string;
  icon: LucideIcon;
  players: DuelActor[];
}[] = [
  {
    mode: 'solo',
    title: 'Solo',
    text: 'Just you and the clock. You pick home or away, and the run lasts until your lives are gone.',
    icon: User,
    players: ['you'],
  },
  {
    mode: 'duel',
    title: 'Duel',
    text: 'Take turns with a live opponent on the same XI. Your filters and theirs go into a coin flip, and one set is used.',
    icon: Swords,
    players: ['you', 'opponent'],
  },
];

export function ModeChoice({ mode, onChange }: ModeChoiceProps) {
  return (
    <fieldset>
      <legend className={`mb-4 ${SECTION_LABEL}`}>Mode</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {MODES.map((option) => {
          const isSelected = mode === option.mode;
          const Icon = option.icon;
          return (
            <label
              key={option.mode}
              className="group flex cursor-pointer flex-col gap-4 rounded-md border-2 border-line bg-surface-card p-5 text-fg hover:bg-surface has-checked:bg-brand has-checked:text-on-accent has-checked:shadow-hard has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus sm:p-6"
            >
              <input
                type="radio"
                name="mode"
                value={option.mode}
                checked={isSelected}
                onChange={() => onChange(option.mode)}
                className="sr-only"
              />
              <span className="flex items-start justify-between gap-3">
                <span
                  aria-hidden="true"
                  className={`size-12 bg-surface-raised ${ICON_TILE}`}
                >
                  <Icon className="size-6" strokeWidth={2.25} />
                </span>
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
              <span className={TYPE_TITLE}>{option.title}</span>
              <span className="max-w-md text-16 text-pretty text-fg-muted group-has-checked:text-on-accent">
                {option.text}
              </span>
              <span aria-hidden="true" className="mt-auto flex gap-1.5">
                {option.players.map((player) => (
                  <span
                    key={player}
                    className={`${ACTOR_BAR} ${DUEL_ACTOR_BG[player]}`}
                  />
                ))}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
