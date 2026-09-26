import { foundCountLabel } from '@/lib/canvas';
import type { MaskedMatch, Side } from '@/types/match';
import type { FoundPlayer } from '@/types/player';

const SIDE_LABELS: Record<Side, string> = {
  home: 'Home XI',
  away: 'Away XI',
};

// Shared box; phones leave room for the quit chip
const HEADER_BOX = 'flex h-14 shrink-0 items-center gap-4 px-2 max-sm:pr-18';

type MatchHeaderProps = {
  match: MaskedMatch | null;
  found: FoundPlayer[];
};

export function MatchHeader({ match, found }: MatchHeaderProps) {
  if (!match) {
    return (
      <div aria-hidden="true" className={HEADER_BOX}>
        <div className="flex flex-col gap-2">
          <span className="h-5 w-40 rounded-sm bg-skeleton-fill" />
          <span className="h-3.5 w-28 rounded-sm bg-skeleton-fill" />
        </div>
      </div>
    );
  }

  const count = foundCountLabel(found);

  return (
    <header className={`${HEADER_BOX} justify-between`}>
      <div className="flex min-w-0 flex-col">
        <h2 className="truncate font-display text-20 leading-7 font-semibold text-fg">
          <span className="sm:hidden">{match.team.shortName}</span>
          <span className="hidden sm:inline">{match.team.name}</span>
        </h2>
        <p className="truncate text-14 leading-5 text-fg-muted">
          {SIDE_LABELS[match.side]} in a {match.formation}
        </p>
      </div>
      <p className="shrink-0 font-display text-24 font-semibold text-fg tabular-nums">
        <span aria-hidden="true">{count.label}</span>
        <span className="sr-only">{count.spoken}</span>
      </p>
    </header>
  );
}
