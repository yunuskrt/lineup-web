import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ICON_TILE } from '@/styles/classes';

type Props = { icon: LucideIcon };

const CardIcon = ({ icon: Icon }: Props) => {
  return (
    <span
      aria-hidden="true"
      className={`size-12 bg-surface-raised ${ICON_TILE}`}
    >
      <Icon className="size-6" strokeWidth={2.25} />
    </span>
  );
};

export default CardIcon;
