import React from 'react';
import CompetitionLogo from '@/components/game/CompetitionLogo';
import Team from '@/components/game/match-header/Team';
import { TEAM } from '@/components/game/match-header/styles';
import { matchHeaderView } from '@/lib/match-header';
import { cn } from '@/lib/utils';
import { TYPE_NUMBER } from '@/styles/classes';
import type { MatchInPlay } from '@/types/match';

// Stacked on phones, one row from sm
const HEADER_BOX =
  'flex h-28 shrink-0 flex-col justify-center gap-1.5 bg-scoreboard px-3 text-on-scoreboard sm:h-20 sm:gap-1';

// Room for the quit and sound chips
const CONTROLS_ROOM = 'max-sm:pr-18 sm:px-28';

const SCORE_ROW =
  'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-5';

const CONTEXT_LINE =
  'flex h-5 min-w-0 items-center justify-center gap-3 text-12 leading-5 text-on-scoreboard/75 sm:text-14';

const PLACEHOLDER = 'rounded-sm bg-on-scoreboard/15';

type Props = {
  match: MatchInPlay | null;
  // The game's quit and sound chips sit on the strip
  hasControls?: boolean;
  className?: string;
};

const MatchHeader = ({ match, hasControls = false, className }: Props) => {
  const box = cn(HEADER_BOX, hasControls && CONTROLS_ROOM, className);

  if (!match) {
    return (
      <div aria-hidden="true" className={box}>
        <div className={SCORE_ROW}>
          {(['home', 'away'] as const).map((side) => (
            <span
              key={side}
              className={`${TEAM[side]} ${side === 'away' ? 'col-start-3' : ''}`}
            >
              <span className={`size-9 sm:size-11 ${PLACEHOLDER}`} />
              <span className={`h-5 w-12 sm:h-6 sm:w-28 ${PLACEHOLDER}`} />
            </span>
          ))}
          <span
            className={`col-start-2 row-start-1 h-8 w-18 sm:h-10 sm:w-24 ${PLACEHOLDER}`}
          />
        </div>
        <div className={CONTEXT_LINE}>
          <span className={`h-3.5 w-40 ${PLACEHOLDER}`} />
        </div>
      </div>
    );
  }

  const view = matchHeaderView(match);

  return (
    <header className={box}>
      <h2 className={SCORE_ROW}>
        <Team team={view.home} side="home" />
        <span
          className={`flex items-baseline gap-1.5 text-24 leading-8 text-score-digits sm:gap-2 sm:text-34 sm:leading-10 ${TYPE_NUMBER}`}
        >
          <span>{view.home.score}</span>
          <span aria-hidden="true" className="text-on-scoreboard/50">
            –
          </span>
          <span className="sr-only">to</span>
          <span>{view.away.score}</span>
        </span>
        <Team team={view.away} side="away" />
      </h2>
      <p className={CONTEXT_LINE}>
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="flex shrink-0 rounded-sm bg-surface-card p-px">
            <CompetitionLogo
              competition={match.competition}
              className="size-4"
            />
          </span>
          <span className="min-w-0 truncate">{view.competition}</span>
        </span>
        <span className="shrink-0">{view.date}</span>
      </p>
      <p className="sr-only">{view.namingLabel}</p>
    </header>
  );
};

export default MatchHeader;
