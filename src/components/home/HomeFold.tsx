import Link from 'next/link';
import { FOCUS_RING, SITE_CONTAINER } from '@/styles/classes';

export function HomeFold() {
  return (
    <section
      aria-labelledby="home-statement"
      className="flex min-h-[calc(100svh_-_var(--spacing)_*_16)] flex-col justify-center"
    >
      <div className={`${SITE_CONTAINER} py-16`}>
        <h1
          id="home-statement"
          className="font-display text-32 leading-tight font-bold text-balance uppercase font-stretch-expanded sm:text-48"
        >
          <span className="block lg:inline">Know the XI.</span>{' '}
          <span className="block lg:inline">Beat the Clock.</span>
        </h1>
        <p className="mt-6 max-w-xl text-16 text-pretty text-fg-muted sm:text-20">
          You get one team from a real match. Name its starting eleven before
          the clock runs down.
        </p>
        <div className="mt-10 flex flex-col items-start gap-4">
          <Link
            href="/play"
            className={`rounded-sm bg-brand px-8 py-3 text-16 font-semibold text-on-accent ${FOCUS_RING}`}
          >
            Play
          </Link>
          <p className="text-14 text-fg-muted">
            No sign-up needed. Have an account?{' '}
            <Link
              href="/sign-in"
              className={`rounded-sm font-medium text-fg underline decoration-line underline-offset-4 hover:decoration-fg ${FOCUS_RING}`}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
