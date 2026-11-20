import React from 'react';
import ClubCrest from '@/components/game/ClubCrest';
import { TEAM } from '@/components/game/match-header/styles';
import type { HeaderSide } from '@/lib/match-header';
import type { Side } from '@/types/match';

type Props = {
  team: HeaderSide;
  side: Side;
};

const Team = ({ team, side }: Props) => {
  return (
    <span className={TEAM[side]}>
      {/* The named XI's crest gets the scoreboard's accent */}
      <span
        className={`flex shrink-0 rounded-md bg-surface-card ${
          team.isNamed ? 'outline-2 outline-offset-2 outline-score-digits' : ''
        }`}
      >
        <ClubCrest club={team.club} />
      </span>
      <span
        className={`w-full truncate text-center text-14 leading-5 sm:w-auto sm:text-16 sm:leading-6 ${
          team.isNamed ? 'font-bold' : 'font-medium text-on-scoreboard/70'
        }`}
      >
        <span className="sm:hidden">{team.club.shortName}</span>
        <span className="hidden sm:inline">{team.club.name}</span>
      </span>
    </span>
  );
};

export default Team;
