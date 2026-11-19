import React from 'react';
import { Check } from 'lucide-react';
import { STATUS_ROW } from '@/components/duel/lobby-panel/styles';
import { Badge } from '@/components/ui/badge';
import type { DuelActor } from '@/types/duel';

type Props = { actor: DuelActor };

const LockedIn = ({ actor }: Props) => {
  return (
    <span className={STATUS_ROW}>
      <Badge variant="sticker" tone={actor} tilt="none">
        <Check strokeWidth={3} aria-hidden="true" />
        Locked in
      </Badge>
    </span>
  );
};

export default LockedIn;
