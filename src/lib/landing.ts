import { competitionGroups } from '@/lib/filters';
import { matchDateLabel } from '@/lib/summary';
import type { CatalogOverview, Showcase } from '@/types/catalog';
import type { CompetitionRef } from '@/types/match';
import type { FoundPlayer } from '@/types/player';

export type Figure = { key: string; value: number; label: string };

type Plural = { one: string; other: string };

const COUNT_FORMAT = new Intl.NumberFormat('en');

const COUNT_WORDS = [
  'no',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
];

export function formatCount(value: number): string {
  return COUNT_FORMAT.format(value);
}

function labelFor(value: number, plural: Plural): string {
  return value === 1 ? plural.one : plural.other;
}

function figure(key: string, value: number, plural: Plural): Figure {
  return { key, value, label: labelFor(value, plural) };
}

export function archiveFigures({ counts }: CatalogOverview): Figure[] {
  return [
    figure('matches', counts.matches, {
      one: 'real match',
      other: 'real matches',
    }),
    figure('players', counts.players, { one: 'player', other: 'players' }),
    figure('sides', counts.clubs + counts.nationalTeams, {
      one: 'club or nation',
      other: 'clubs and nations',
    }),
    figure('seasons', counts.seasons, { one: 'season', other: 'seasons' }),
  ];
}

export function highlightFigures({ highlights }: CatalogOverview): Figure[] {
  return [
    figure('finals', highlights.finals, { one: 'final', other: 'finals' }),
    figure('shootouts', highlights.shootouts, {
      one: 'penalty shootout',
      other: 'penalty shootouts',
    }),
    figure('extraTime', highlights.extraTime, {
      one: 'went to extra time',
      other: 'went to extra time',
    }),
    figure('goals', highlights.goals, { one: 'goal', other: 'goals' }),
  ];
}

// Leagues, then European cups, then international
export function landingCompetitions(
  overview: CatalogOverview,
): CompetitionRef[] {
  return competitionGroups(overview.competitions).flatMap(
    (group) => group.competitions,
  );
}

function namedClub({ match }: Showcase): string {
  return match[match.side].name;
}

export function showcaseCaption(showcase: Showcase): string {
  return `${namedClub(showcase)}'s XI, ${matchDateLabel(showcase.match.date)}`;
}

export function showcaseSentence(showcase: Showcase): string {
  const count = showcase.demo.reveals.length;
  const word = COUNT_WORDS[count] ?? formatCount(count);
  return `A turn being played: ${word} of ${namedClub(showcase)}'s starting eleven named against the clock.`;
}

// The still frame: the demo's reveals, in its order
export function showcaseFound({ players, demo }: Showcase): FoundPlayer[] {
  return demo.reveals.flatMap((slot) =>
    players.filter((player) => player.slot === slot),
  );
}
