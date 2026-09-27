import { foundCountLabel } from '@/lib/canvas';
import { matchSubtitle, scoreline } from '@/lib/summary';
import type { MaskedMatch, MatchIdentity, Side } from '@/types/match';
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
  // Revealed in full once the run is over
  identity?: MatchIdentity;
};

type HeaderLines = { short: string; full: string; subtitle: string };

function headerLines(
  match: MaskedMatch,
  identity?: MatchIdentity,
): HeaderLines {
  if (identity) {
    return {
      short: scoreline(identity, 'shortName'),
      full: scoreline(identity),
      subtitle: matchSubtitle(identity),
    };
  }

  return {
    short: match.team.shortName,
    full: match.team.name,
    subtitle: `${SIDE_LABELS[match.side]} in a ${match.formation}`,
  };
}

export function MatchHeader({ match, found, identity }: MatchHeaderProps) {
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
  const lines = headerLines(match, identity);

  return (
    <header className={`${HEADER_BOX} justify-between`}>
      <div className="flex min-w-0 flex-col">
        {/* Same leading, so the box doesn't move */}
        <h2
          className={`truncate font-display text-20 leading-7 font-semibold text-fg ${
            identity ? 'max-sm:text-16' : ''
          }`}
        >
          <span className="sm:hidden">{lines.short}</span>
          <span className="hidden sm:inline">{lines.full}</span>
        </h2>
        <p
          title={lines.subtitle}
          className="truncate text-14 leading-5 text-fg-muted"
        >
          {lines.subtitle}
        </p>
      </div>
      <p className="shrink-0 font-display text-24 font-semibold text-fg tabular-nums">
        <span aria-hidden="true">{count.label}</span>
        <span className="sr-only">{count.spoken}</span>
      </p>
    </header>
  );
}
