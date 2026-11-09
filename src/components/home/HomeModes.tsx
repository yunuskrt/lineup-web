import Link from 'next/link';
import { FILTER_PARAMS } from '@/lib/filters';
import { SITE_CONTAINER, TEXT_LINK } from '@/styles/classes';

const DUEL = `/play?${FILTER_PARAMS.mode}=duel`;

const MODES = [
  {
    name: 'Solo',
    line: 'Your filters, your pace. Name the XI before your three lives run out.',
    links: [{ label: 'Play solo', href: `/play?${FILTER_PARAMS.mode}=solo` }],
  },
  {
    name: 'Duel',
    line: 'Live 1v1 on one shared XI. Spend the easy names before they do.',
    links: [
      { label: 'Find a duel', href: DUEL },
      { label: 'Play a friend', href: `${DUEL}#play-a-friend` },
    ],
  },
];

export function HomeModes() {
  return (
    <section aria-labelledby="home-modes" className="border-t border-line">
      <div className={`${SITE_CONTAINER} py-16`}>
        <h2 id="home-modes" className="sr-only">
          Two ways to play
        </h2>
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12">
          {MODES.map((mode) => (
            <div key={mode.name} className="flex flex-col gap-3">
              <h3 className="font-display text-24 font-bold">{mode.name}</h3>
              <p className="max-w-md text-16 text-pretty text-fg-muted sm:text-20">
                {mode.line}
              </p>
              <p className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-16">
                {mode.links.map((link) => (
                  <Link key={link.label} href={link.href} className={TEXT_LINK}>
                    {link.label}
                  </Link>
                ))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
