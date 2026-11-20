import React from 'react';
import CompetitionLogo from '@/components/game/CompetitionLogo';
import type { CompetitionRef } from '@/types/match';

type Props = {
  competition: CompetitionRef;
};

const CompetitionChipImage = ({ competition }: Props) => {
  return <CompetitionLogo competition={competition} className="size-5" />;
};

export default CompetitionChipImage;
