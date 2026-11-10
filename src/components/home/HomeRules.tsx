'use client';

import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import {
  ArcMark,
  type MarkProps,
  PipsMark,
  SlotsMark,
} from '@/components/home/RuleMarks';
import { useEntrance } from '@/hooks/use-entrance';
import { SITE_CONTAINER } from '@/styles/classes';
import { LANDING_STAGGER_MS } from '@/styles/motion';

const RULES: { count: number; text: string; Mark: ComponentType<MarkProps> }[] =
  [
    {
      count: 11,
      text: 'Starters to name, from one team in one real match.',
      Mark: SlotsMark,
    },
    {
      count: 15,
      text: 'Seconds a turn. Name a new player to end it.',
      Mark: ArcMark,
    },
    {
      count: 3,
      text: 'Lives. Only the clock takes one. A wrong name just costs time.',
      Mark: PipsMark,
    },
  ];

export function HomeRules() {
  const { ref, item, isShown } = useEntrance<HTMLDListElement>();

  return (
    <section aria-labelledby="home-rules" className="border-t border-line">
      <div className={`${SITE_CONTAINER} py-16`}>
        <h2 id="home-rules" className="sr-only">
          How it plays
        </h2>
        <dl ref={ref} className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {RULES.map(({ count, text, Mark }, index) => (
            <motion.div
              key={count}
              className="flex flex-col gap-3"
              {...item(index)}
            >
              {/* The mark sits in the term: dl allows dt, dd */}
              <dt className="flex flex-col gap-3 font-display text-32 leading-10 font-bold tabular-nums sm:text-48 sm:leading-15">
                <span className="flex h-12 items-center">
                  <Mark
                    isShown={isShown}
                    delayMs={index * LANDING_STAGGER_MS}
                  />
                </span>
                {count}
              </dt>
              <dd className="max-w-xs text-16 text-pretty text-fg-muted sm:text-20">
                {text}
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}
