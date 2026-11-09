import { z } from 'zod';
import {
  directoryKeySchema,
  eraRangeSchema,
  idSchema,
  imageUrlSchema,
  seasonStartSchema,
  SQUAD_SIZE,
} from '@/lib/api/schemas/common';
import {
  clubRefSchema,
  competitionRefSchema,
  matchInPlaySchema,
} from '@/lib/api/schemas/match';
import { revealedPlayerSchema } from '@/lib/api/schemas/player';

// The pool's view of one competition
export const competitionOptionSchema = competitionRefSchema.extend({
  clubIds: z.array(idSchema),
  seasonStarts: z.array(seasonStartSchema).min(1),
});

export const filterOptionsSchema = z.object({
  competitions: z.array(competitionOptionSchema),
  clubs: z.array(clubRefSchema),
  era: eraRangeSchema,
});

// Every player, unscoped: searched, never shown
export const directoryPlayerSchema = z.object({
  key: directoryKeySchema,
  name: z.string().min(1),
  imageUrl: imageUrlSchema.nullable(),
  terms: z.array(z.string().min(1)).min(1),
});

export const playerDirectorySchema = z.object({
  players: z.array(directoryPlayerSchema),
});

export const TOP_CLUBS_MAX = 12;

const countSchema = z.number().int().nonnegative();

export const overviewCountsSchema = z.object({
  matches: countSchema,
  players: countSchema,
  clubs: countSchema,
  nationalTeams: countSchema,
  seasons: countSchema,
});

export const overviewHighlightsSchema = z.object({
  finals: countSchema,
  shootouts: countSchema,
  extraTime: countSchema,
  goals: countSchema,
});

// The wrong guess: from the other side's XI
export const showcaseMissSchema = revealedPlayerSchema.pick({
  name: true,
  imageUrl: true,
  directoryKey: true,
});

export const showcaseDemoSchema = z.object({
  // Slots, in the order the demo names them
  reveals: z
    .array(revealedPlayerSchema.shape.slot)
    .min(1)
    .max(SQUAD_SIZE)
    .refine((slots) => new Set(slots).size === slots.length, {
      error: 'Each slot is revealed once',
    }),
  miss: showcaseMissSchema.nullable(),
});

// Out of the pool, so its XI is safe to send
export const showcaseSchema = z
  .object({
    match: matchInPlaySchema,
    players: z
      .array(revealedPlayerSchema)
      .length(SQUAD_SIZE)
      .refine(
        (players) =>
          new Set(players.map((player) => player.slot)).size === SQUAD_SIZE,
        { error: 'Every slot is filled once' },
      ),
    demo: showcaseDemoSchema,
  })
  .refine(
    ({ players, demo }) =>
      demo.reveals.every((slot) =>
        players.some((player) => player.slot === slot),
      ),
    { error: 'Every revealed slot is in the XI', path: ['demo', 'reveals'] },
  );

export const catalogOverviewSchema = z.object({
  counts: overviewCountsSchema,
  era: eraRangeSchema,
  highlights: overviewHighlightsSchema,
  competitions: z.array(competitionRefSchema),
  topClubs: z.array(clubRefSchema).max(TOP_CLUBS_MAX),
  showcase: showcaseSchema.nullable(),
});
