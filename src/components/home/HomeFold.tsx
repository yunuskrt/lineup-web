import Link from 'next/link';
import React, { type ReactNode } from 'react';
import HomeShowcase from '@/components/home/home-fold/HomeShowcase';
import { cn } from '@/lib/utils';
import {
  PRIMARY_BUTTON_LARGE,
  SITE_CONTAINER,
  TEXT_LINK,
  TYPE_DISPLAY,
} from '@/styles/classes';

// Sized so the boxed line never wraps
const STATEMENT = cn(
  TYPE_DISPLAY,
  // After the sizes: a size drops leading in cn
  'text-28 leading-none sm:text-34 md:text-64 lg:text-40 xl:text-48',
);

type Props = {
  // Dev snapshots pass a fixed frame
  showcase?: ReactNode;
};

const HomeFold = ({ showcase = <HomeShowcase /> }: Props) => {
  return (
    <section
      aria-labelledby="home-statement"
      className="flex flex-col justify-center lg:min-h-[calc(100svh_-_var(--spacing)_*_16)]"
    >
      <div
        className={`${SITE_CONTAINER} grid gap-12 py-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center`}
      >
        <div>
          <h1 id="home-statement" className={STATEMENT}>
            <span className="block">Know the XI.</span>{' '}
            {/* A sticker block; the text stays one heading */}
            <span className="mt-2 block md:mt-3">
              <span className="inline-block -rotate-2 rounded-sm border-2 border-line bg-block-butter px-1 py-0.5 shadow-hard-sm sm:px-2">
                Guess the Squad.
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-16 text-pretty text-fg-muted sm:text-20">
            You get one team from a real match. Name its starting eleven before
            the clock runs down.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4">
            <Link href="/play" className={PRIMARY_BUTTON_LARGE}>
              Play
            </Link>
            <p className="text-14 text-fg-muted">
              No sign-up needed. Have an account?{' '}
              <Link href="/sign-in" className={TEXT_LINK}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
        {showcase}
      </div>
    </section>
  );
};

export default HomeFold;
