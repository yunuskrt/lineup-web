import Link from 'next/link';
import type { ReactNode } from 'react';
import { HomeShowcase } from '@/components/home/ShowcaseFrame';
import {
  PRIMARY_BUTTON_LARGE,
  SITE_CONTAINER,
  TEXT_LINK,
} from '@/styles/classes';

type HomeFoldProps = {
  // Dev snapshots pass a fixed frame
  showcase?: ReactNode;
};

export function HomeFold({ showcase = <HomeShowcase /> }: HomeFoldProps) {
  return (
    <section
      aria-labelledby="home-statement"
      className="flex flex-col justify-center lg:min-h-[calc(100svh_-_var(--spacing)_*_16)]"
    >
      <div
        className={`${SITE_CONTAINER} grid gap-12 py-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center`}
      >
        <div>
          <h1
            id="home-statement"
            className="font-display text-32 leading-tight font-bold text-balance uppercase font-stretch-expanded sm:text-48"
          >
            <span className="block lg:whitespace-nowrap">Know the XI.</span>{' '}
            <span className="block lg:whitespace-nowrap">Beat the Clock.</span>
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
}
