import React from 'react';
import FilterChipImage from '@/components/play/FilterChipImage';
import { SHIELD_PATH } from '@/components/play/filter-icons';
import type { ClubRef } from '@/types/match';

type Props = { club: ClubRef };

const ClubChipImage = ({ club }: Props) => {
  return (
    <FilterChipImage
      src={club.crestUrl}
      fallback={
        // Lifts to muted on a pressed chip for contrast
        <svg
          viewBox="0 0 24 24"
          className="size-full fill-current text-fg-dim group-aria-pressed:text-fg-muted"
        >
          <path d={SHIELD_PATH} />
        </svg>
      }
    />
  );
};

export default ClubChipImage;
