'use client';

import { motion } from 'motion/react';
import React, { type ComponentType } from 'react';
import ArcMark from '@/components/home/rule-marks/ArcMark';
import type { MarkProps } from '@/components/home/rule-marks/marks';
import PipsMark from '@/components/home/rule-marks/PipsMark';
import SlotsMark from '@/components/home/rule-marks/SlotsMark';
import { useEntrance } from '@/hooks/use-entrance';
import { HOME_BAND, SITE_CONTAINER, TYPE_NUMBER } from '@/styles/classes';
import { LANDING_STAGGER_MS } from '@/styles/motion';

const RULES: {
  count: number;
  text: string;
  Mark: ComponentType<MarkProps>;
  fill: string;
}[] = [
  {
    count: 11,
    text: 'Starters to name, from one team in one real match.',
    Mark: SlotsMark,
    fill: 'bg-block-lavender',
  },
  {
    count: 15,
    text: 'Seconds a turn. Name a new player to end it.',
    Mark: ArcMark,
    fill: 'bg-block-mint',
  },
  {
    count: 3,
    text: 'Lives. Only the clock takes one. A wrong name just costs time.',
    Mark: PipsMark,
    fill: 'bg-block-butter',
  },
];

type Props = {};

const HomeRules = ({}: Props) => {
  const { ref, item, isShown } = useEntrance<HTMLDListElement>();

  return (
    <section aria-labelledby="home-rules" className={HOME_BAND}>
      <div className={`${SITE_CONTAINER} py-16`}>
        <h2 id="home-rules" className="sr-only">
          How it plays
        </h2>
        <dl ref={ref} className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {RULES.map(({ count, text, Mark, fill }, index) => (
            <motion.div
              key={count}
              className={`flex flex-col gap-3 rounded-lg border-2 border-line p-5 text-on-accent shadow-hard sm:p-6 ${fill}`}
              {...item(index)}
            >
              {/* The mark sits in the term: dl allows dt, dd */}
              <dt
                className={`flex items-center justify-between gap-3 text-48 leading-15 sm:text-64 sm:leading-16 ${TYPE_NUMBER}`}
              >
                {count}
                <span className="flex h-12 items-center">
                  <Mark
                    isShown={isShown}
                    delayMs={index * LANDING_STAGGER_MS}
                  />
                </span>
              </dt>
              <dd className="max-w-xs text-16 text-pretty sm:text-20">
                {text}
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default HomeRules;
