import { ClubCrest } from '@/components/game/ClubCrest';
import { foundCountLabel } from '@/lib/canvas';
import { type HeaderSide, matchHeaderView } from '@/lib/match-header';
import type { MatchInPlay, Side } from '@/types/match';
import type { FoundPlayer } from '@/types/player';

// Shared box; phones leave room for the quit chip
const HEADER_BOX =
  'grid h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-3 gap-y-1 px-2 max-sm:pr-18 sm:h-18';

// Phones give line one the full width
const LINE_ONE =
  'col-start-1 row-start-1 flex h-8 items-center justify-center gap-2 max-sm:col-span-2 sm:h-10 sm:gap-3';

const LINE_TWO =
  'col-start-1 row-start-2 flex h-5 min-w-0 items-center justify-center gap-3';

// Beside line two on phones, both lines from sm
const COUNT = 'col-start-2 row-start-2 sm:row-span-2 sm:row-start-1';

type MatchHeaderProps = {
  match: MatchInPlay | null;
  found: FoundPlayer[];
};

type TeamProps = {
  team: HeaderSide;
  side: Side;
};

// Both sides pack toward the score
const TEAM_ROW: Record<Side, string> = {
  home: 'justify-end',
  away: 'flex-row-reverse justify-end',
};

function Team({ team, side }: TeamProps) {
  return (
    <span
      className={`flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 ${TEAM_ROW[side]}`}
    >
      <ClubCrest club={team.club} isNamed={team.isNamed} />
      <span
        className={`min-w-0 truncate font-display text-16 leading-7 font-semibold sm:text-20 ${
          team.isNamed ? 'text-fg' : 'text-fg-muted'
        }`}
      >
        <span className="sm:hidden">{team.club.shortName}</span>
        <span className="hidden sm:inline">{team.club.name}</span>
      </span>
    </span>
  );
}

export function MatchHeader({ match, found }: MatchHeaderProps) {
  if (!match) {
    return (
      <div aria-hidden="true" className={HEADER_BOX}>
        <div className={LINE_ONE}>
          <span className="size-8 rounded-sm bg-skeleton-fill sm:size-10" />
          <span className="h-5 w-32 rounded-sm bg-skeleton-fill sm:w-56" />
          <span className="size-8 rounded-sm bg-skeleton-fill sm:size-10" />
        </div>
        <div className={LINE_TWO}>
          <span className="h-3.5 w-36 rounded-sm bg-skeleton-fill" />
        </div>
      </div>
    );
  }

  const count = foundCountLabel(found);
  const view = matchHeaderView(match);

  return (
    <header className={HEADER_BOX}>
      <h2 className={LINE_ONE}>
        <Team team={view.home} side="home" />
        <span className="flex shrink-0 items-baseline gap-1.5 font-display text-20 leading-7 font-semibold text-fg tabular-nums sm:text-24">
          <span>{view.home.score}</span>
          <span aria-hidden="true" className="text-fg-dim">
            –
          </span>
          <span className="sr-only">to</span>
          <span>{view.away.score}</span>
        </span>
        <Team team={view.away} side="away" />
      </h2>
      <p className={`${LINE_TWO} text-14 leading-5 text-fg-muted`}>
        <span className="min-w-0 truncate">{view.competition}</span>
        <span className="shrink-0">{view.date}</span>
      </p>
      <p className="sr-only">{view.namingLabel}</p>
      <p
        className={`${COUNT} font-display text-16 leading-5 font-semibold text-fg tabular-nums sm:text-24`}
      >
        <span aria-hidden="true">{count.label}</span>
        <span className="sr-only">{count.spoken}</span>
      </p>
    </header>
  );
}
