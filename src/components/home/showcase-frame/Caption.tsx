import React, { type ReactNode } from 'react';
import { showcaseCaption, showcaseSentence } from '@/lib/landing';
import type { Showcase } from '@/types/catalog';

type Props = {
  showcase: Showcase;
  control?: ReactNode;
};

const Caption = ({ showcase, control }: Props) => {
  return (
    <>
      <div className="flex min-h-6 items-center justify-between gap-4">
        <figcaption className="text-14 text-fg-muted">
          {showcaseCaption(showcase)}
        </figcaption>
        {control}
      </div>
      <p className="sr-only">{showcaseSentence(showcase)}</p>
    </>
  );
};

export default Caption;
