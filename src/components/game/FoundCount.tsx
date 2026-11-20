import React from 'react';
import { Badge } from '@/components/ui/badge';
import { foundCountLabel } from '@/lib/canvas';
import type { FoundPlayer } from '@/types/player';

type Props = { found: FoundPlayer[] };

// Sits on the pitch card's corner, over the turf
const FoundCount = ({ found }: Props) => {
  const count = foundCountLabel(found);

  return (
    <Badge variant="sticker" className="absolute top-2 left-2 z-10">
      <span aria-hidden="true">{count.label}</span>
      <span className="sr-only">{count.spoken}</span>
    </Badge>
  );
};

export default FoundCount;
