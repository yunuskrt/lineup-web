import { describe, expect, it } from 'vitest';
import { overviewFrom } from '@/lib/api/mock/overview';
import {
  archiveFigures,
  eraLine,
  formatCount,
  highlightFigures,
  landingCompetitions,
  showcaseCaption,
  showcaseFound,
  showcaseSentence,
} from '@/lib/landing';
import type { Showcase } from '@/types/catalog';

const OVERVIEW = overviewFrom();

function showcase(): Showcase {
  if (!OVERVIEW.showcase) throw new Error('The mock has a showcase');
  return OVERVIEW.showcase;
}

describe('formatCount', () => {
  it('groups thousands, whatever the viewer locale', () => {
    expect(formatCount(1924)).toBe('1,924');
    expect(formatCount(88406)).toBe('88,406');
    expect(formatCount(9)).toBe('9');
  });
});

describe('archiveFigures', () => {
  it('adds national teams to clubs, as one figure', () => {
    const sides = archiveFigures(OVERVIEW).find((f) => f.key === 'sides');
    expect(sides?.value).toBe(
      OVERVIEW.counts.clubs + OVERVIEW.counts.nationalTeams,
    );
    expect(sides?.label).toBe('clubs and nations');
  });

  it('labels a count of one in the singular', () => {
    const counts = { ...OVERVIEW.counts, matches: 1, seasons: 1 };
    const labels = archiveFigures({ ...OVERVIEW, counts }).map((f) => f.label);
    expect(labels).toContain('real match');
    expect(labels).toContain('season');
  });
});

describe('highlightFigures', () => {
  it('keeps the four highlights in order', () => {
    expect(highlightFigures(OVERVIEW).map((f) => f.label)).toEqual([
      'finals',
      'penalty shootouts',
      'went to extra time',
      'goals',
    ]);
  });
});

describe('eraLine', () => {
  it('names the first and last seasons', () => {
    expect(eraLine({ from: 2000, to: 2025 })).toBe('2000–01 to 2025–26');
  });

  it('names one season once', () => {
    expect(eraLine({ from: 2004, to: 2004 })).toBe('2004–05');
  });
});

describe('landingCompetitions', () => {
  it('orders leagues, then European cups, then international', () => {
    const kinds = landingCompetitions(OVERVIEW).map((c) => c.kind);
    const leagues = kinds.lastIndexOf('league');
    const cups = kinds.findIndex((kind) => kind === 'ucl' || kind === 'uel');
    const international = kinds.findIndex(
      (kind) => kind === 'world_cup' || kind === 'euro',
    );
    expect(leagues).toBeLessThan(cups);
    expect(cups).toBeLessThan(international);
  });
});

describe('the showcase copy', () => {
  it('captions the named side and the date', () => {
    expect(showcaseCaption(showcase())).toBe(
      "Northgate United's XI, 7 May 2019",
    );
  });

  it('tells screen readers how many are named', () => {
    expect(showcaseSentence(showcase())).toBe(
      "A turn being played: eight of Northgate United's starting eleven named against the clock.",
    );
  });

  it('fills only the revealed slots, in the demo order', () => {
    const found = showcaseFound(showcase());
    expect(found.map((player) => player.slot)).toEqual(showcase().demo.reveals);
  });
});
