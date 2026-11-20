import React from 'react';
import ClubCrest from '@/components/game/ClubCrest';
import CompetitionLogo from '@/components/game/CompetitionLogo';
import { STRIP } from '@/components/home/home-inside/styles';
import { landingCompetitions } from '@/lib/landing';
import { ICON_TILE } from '@/styles/classes';
import type { CatalogOverview } from '@/types/catalog';
import { Marquee } from '@/components/ui/marquee';

const PILL =
  'flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-line bg-surface-card px-3 text-14 font-medium whitespace-nowrap text-fg';
const CREST_TILE = `size-11 shrink-0 bg-surface-card ${ICON_TILE}`;

type Props = { overview: CatalogOverview };

// Decorative: the hidden lists say it to readers
const LogoStrip = ({ overview }: Props) => {
  return (
    <div aria-hidden="true" className={STRIP}>
      <Marquee className="px-4">
        {landingCompetitions(overview).map((competition) => (
          <span key={competition.id} className={PILL}>
            <CompetitionLogo competition={competition} className="size-6" />
            {competition.name}
          </span>
        ))}
        {overview.topClubs.map((club) => (
          <span key={club.id} className={CREST_TILE}>
            <ClubCrest club={club} size="row" />
          </span>
        ))}
      </Marquee>
    </div>
  );
};

export default LogoStrip;
