import { DUEL_ACTOR_BG } from '@/styles/classes';
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
  players: DuelActor[];
}[] = [
  {
    mode: 'solo',
    title: 'Solo',
    text: 'Just you and the clock. You pick home or away, and the run lasts until your lives are gone.',
    players: ['you'],
  },
  {
    mode: 'duel',
    title: 'Duel',
    text: 'Take turns with a live opponent on the same XI. Your filters and theirs go into a coin flip, and one set is used.',
    players: ['you', 'opponent'],
  },
];

export function ModeChoice({ mode, onChange }: ModeChoiceProps) {
  return (
    <fieldset>
      <legend className="sr-only">Mode</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {MODES.map((option) => (
          <label
            key={option.mode}
            className="flex cursor-pointer flex-col gap-4 rounded-md border border-line p-6 hover:bg-surface-raised has-checked:border-brand has-checked:bg-surface-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand sm:p-8"
          >
            <input
              type="radio"
              name="mode"
              value={option.mode}
              checked={mode === option.mode}
              onChange={() => onChange(option.mode)}
              className="sr-only"
            />
            <span aria-hidden="true" className="flex gap-1.5">
              {option.players.map((player) => (
                <span
                  key={player}
                  className={`h-1 w-8 ${DUEL_ACTOR_BG[player]}`}
                />
              ))}
            </span>
            <span className="font-display text-32 font-bold uppercase font-stretch-expanded sm:text-48">
              {option.title}
            </span>
            <span className="max-w-md text-16 text-pretty text-fg-muted">
              {option.text}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
