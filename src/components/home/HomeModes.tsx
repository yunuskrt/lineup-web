import { type LucideIcon, Swords, User } from 'lucide-react';
import Link from 'next/link';
import { FILTER_PARAMS } from '@/lib/filters';
import {
  ACTOR_BAR,
  DUEL_ACTOR_BG,
  HOME_BAND,
  ICON_TILE,
  PRIMARY_BUTTON_LARGE,
  SECONDARY_BUTTON_LARGE,
  SITE_CONTAINER,
  TYPE_TITLE,
} from '@/styles/classes';
import type { DuelActor } from '@/types/duel';

const DUEL = `/play?${FILTER_PARAMS.mode}=duel`;

type ModeLink = { label: string; href: string; isPrimary: boolean };

const MODES: {
  name: string;
  line: string;
  icon: LucideIcon;
  players: DuelActor[];
  links: ModeLink[];
}[] = [
  {
    name: 'Solo',
    icon: User,
    players: ['you'],
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
    icon: Swords,
    players: ['you', 'opponent'],
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
    <section
      aria-labelledby="home-modes"
      className={`${HOME_BAND} bg-block-mint`}
    >
      <div className={`${SITE_CONTAINER} py-16`}>
        <h2 id="home-modes" className="sr-only">
          Two ways to play
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.name}
                className="flex flex-col gap-4 rounded-lg border-2 border-line bg-surface-card p-5 shadow-hard sm:p-6"
              >
                <span
                  aria-hidden="true"
                  className={`size-12 bg-surface-raised ${ICON_TILE}`}
                >
                  <Icon className="size-6" strokeWidth={2.25} />
                </span>
                <h3 className={TYPE_TITLE}>{mode.name}</h3>
                <p className="max-w-md text-16 text-pretty text-fg-muted sm:text-20">
                  {mode.line}
                </p>
                <span aria-hidden="true" className="flex gap-1.5">
                  {mode.players.map((player) => (
                    <span
                      key={player}
                      className={`${ACTOR_BAR} ${DUEL_ACTOR_BG[player]}`}
                    />
                  ))}
                </span>
                <div className="mt-auto flex flex-wrap gap-3 pt-2">
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
