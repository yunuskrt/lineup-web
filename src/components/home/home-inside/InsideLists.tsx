import React from 'react';
import { landingCompetitions } from '@/lib/landing';
import type { CatalogOverview } from '@/types/catalog';

type Props = { overview: CatalogOverview };

const InsideLists = ({ overview }: Props) => {
  return (
    <>
      <ul aria-label="Competitions" className="sr-only">
        {landingCompetitions(overview).map((competition) => (
          <li key={competition.id}>{competition.name}</li>
        ))}
      </ul>
      {overview.topClubs.length > 0 ? (
        <ul aria-label="Clubs with the most matches" className="sr-only">
          {overview.topClubs.map((club) => (
            <li key={club.id}>{club.name}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
};

export default InsideLists;
