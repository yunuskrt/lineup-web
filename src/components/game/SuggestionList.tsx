'use client';

import { PlayerHeadshot } from '@/components/pitch/PlayerHeadshot';
import type { Suggestion } from '@/lib/suggestions';

type SuggestionListProps = {
  id: string;
  suggestions: readonly Suggestion[];
  highlightedKey: string | null;
  optionId: (key: string) => string;
  onPick: (suggestion: Suggestion) => void;
};

export function SuggestionList({
  id,
  suggestions,
  highlightedKey,
  optionId,
  onPick,
}: SuggestionListProps) {
  return (
    <div className="absolute inset-x-0 bottom-full z-20 mb-1 overflow-hidden rounded-md border border-line bg-surface-card">
      <ul
        id={id}
        role="listbox"
        aria-label="Suggested players"
        className="max-h-55 overflow-y-auto"
      >
        {suggestions.map((suggestion) => {
          const { player, isNamed } = suggestion;
          const isHighlighted = player.key === highlightedKey;
          return (
            <li
              key={player.key}
              id={optionId(player.key)}
              role="option"
              aria-selected={isHighlighted}
              aria-disabled={isNamed || undefined}
              // Keeps focus, and the keyboard, in the input
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!isNamed) onPick(suggestion);
              }}
              className={`flex h-11 items-center gap-3 px-3 ${
                isNamed
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-surface-raised'
              } ${isHighlighted ? 'bg-surface-raised' : ''}`}
            >
              <PlayerHeadshot
                name={player.name}
                imageUrl={player.imageUrl}
                sizeClass="size-8"
              />
              <span
                className={`min-w-0 flex-1 truncate text-14 font-medium ${
                  isNamed ? 'text-fg-muted' : 'text-fg'
                }`}
              >
                {player.name}
              </span>
              {isNamed ? (
                <span className="shrink-0 text-12 text-fg-muted">Named</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
