import React from 'react';
import CompetitionChipImage from '@/components/play/filter-panel/CompetitionChipImage';
import type { FilterPanelProps } from '@/components/play/FilterPanel';
import Chip from '@/components/play/filter-panel/Chip';
import CompetitionGroup from '@/components/play/filter-panel/CompetitionGroup';
import FilterRow from '@/components/play/filter-panel/FilterRow';
import {
  competitionGroups,
  pickedCompetition,
  selectCompetition,
} from '@/lib/filters';

type Props = FilterPanelProps;

const CompetitionFilter = ({ options, filters, onChange }: Props) => {
  const picked = pickedCompetition(filters, options);

  function choose(id: string | null) {
    onChange(selectCompetition(filters, id, options));
  }

  return (
    <FilterRow label="Competition">
      <div className="flex flex-col items-start gap-4">
        <Chip isPressed={picked === null} onClick={() => choose(null)}>
          Any competition
        </Chip>
        {competitionGroups(options.competitions).map((group) => (
          <CompetitionGroup key={group.label} label={group.label}>
            {group.competitions.map((competition) => {
              const isPicked = picked?.id === competition.id;
              return (
                <Chip
                  key={competition.id}
                  isPressed={isPicked}
                  onClick={() => choose(isPicked ? null : competition.id)}
                  image={<CompetitionChipImage competition={competition} />}
                >
                  {competition.name}
                </Chip>
              );
            })}
          </CompetitionGroup>
        ))}
      </div>
    </FilterRow>
  );
};

export default CompetitionFilter;
