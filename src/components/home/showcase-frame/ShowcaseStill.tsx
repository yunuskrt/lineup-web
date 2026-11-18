import React from 'react';
import Caption from '@/components/home/showcase-frame/Caption';
import { STILL_STAGE } from '@/components/home/showcase-frame/shared';
import Stage from '@/components/home/showcase-frame/Stage';
import { FIGURE } from '@/components/home/showcase-frame/styles';
import { showcaseFound } from '@/lib/landing';
import type { Showcase } from '@/types/catalog';

type Props = { showcase: Showcase };

// Reduced motion: nothing moves
const ShowcaseStill = ({ showcase }: Props) => {
  return (
    <figure className={FIGURE}>
      <Stage
        {...STILL_STAGE}
        match={showcase.match}
        found={showcaseFound(showcase)}
      />
      <Caption showcase={showcase} />
    </figure>
  );
};

export default ShowcaseStill;
