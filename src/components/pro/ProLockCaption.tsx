import React from 'react';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PRO_PATH } from '@/lib/pro';
import { TEXT_LINK } from '@/styles/classes';

type Props = {
  id: string;
  caption: string;
};

const ProLockCaption = ({ id, caption }: Props) => {
  return (
    <p id={id} className="text-12 leading-5 text-fg-muted">
      <Badge tone="brand" aria-hidden="true" className="mr-1.5 align-middle">
        <Lock />
        Pro
      </Badge>
      {caption}{' '}
      <Link href={PRO_PATH} className={TEXT_LINK}>
        See Pro
      </Link>
    </p>
  );
};

export default ProLockCaption;
