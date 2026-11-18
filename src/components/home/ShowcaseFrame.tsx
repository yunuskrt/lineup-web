'use client';

import React from 'react';
import { STILL_STAGE } from '@/components/home/showcase-frame/shared';
import ShowcaseDemo from '@/components/home/showcase-frame/ShowcaseDemo';
import ShowcaseStill from '@/components/home/showcase-frame/ShowcaseStill';
import Stage from '@/components/home/showcase-frame/Stage';
import { FIGURE } from '@/components/home/showcase-frame/styles';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import type { Showcase } from '@/types/catalog';
import type { ShowcasePlayback } from '@/types/landing';
import { SKELETON } from '@/components/ui/skeleton';

type Props = {
  showcase: Showcase | null;
  isLoading: boolean;
  playback?: ShowcasePlayback;
};

const ShowcaseFrame = ({ showcase, isLoading, playback = {} }: Props) => {
  const runs = useMotionPolicy();

  if (showcase) {
    return runs('demoLoop') && !playback.isStill ? (
      <ShowcaseDemo showcase={showcase} playback={playback} />
    ) : (
      <ShowcaseStill showcase={showcase} />
    );
  }
  if (!isLoading) return null;

  return (
    <figure className={FIGURE}>
      <Stage {...STILL_STAGE} match={null} found={[]} />
      <div className="flex min-h-6 items-center">
        <span aria-hidden="true" className={`h-5 w-48 ${SKELETON}`} />
      </div>
    </figure>
  );
};

export default ShowcaseFrame;
