import Link from 'next/link';
import { FILTER_PARAMS } from '@/lib/filters';
import {
  PRIMARY_BUTTON_LARGE,
  SECONDARY_BUTTON_LARGE,
  SITE_CONTAINER,
} from '@/styles/classes';

const DUEL = `/play?${FILTER_PARAMS.mode}=duel`;

type ModeLink = { label: string; href: string; isPrimary: boolean };

const MODES: { name: string; line: string; links: ModeLink[] }[] = [
  {
    name: 'Solo',
    line: 'Your filters, your pace. Name the XI before your three lives run out.',
    links: [
      {
        label: 'Play solo',
        href: `/play?${FILTER_PARAMS.mode}=solo`,
        isPrimary: true,
      },
    ],
  },
  {
    name: 'Duel',
    line: 'Live 1v1 on one shared XI. Spend the easy names before they do.',
    links: [
      { label: 'Find a duel', href: DUEL, isPrimary: true },
      {
        label: 'Play a friend',
        href: `${DUEL}#play-a-friend`,
        isPrimary: false,
      },
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
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {MODES.map((mode) => (
            <div
              key={mode.name}
              className="flex flex-col gap-3 rounded-lg border border-line bg-surface-raised p-6"
            >
              <h3 className="font-display text-24 font-bold">{mode.name}</h3>
              <p className="max-w-md text-16 text-pretty text-fg-muted sm:text-20">
                {mode.line}
              </p>
              <div className="mt-auto flex flex-wrap gap-3 pt-3">
                {mode.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={
                      link.isPrimary
                        ? PRIMARY_BUTTON_LARGE
                        : SECONDARY_BUTTON_LARGE
                    }
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
