import { z } from 'zod';
import { idSchema } from '@/lib/api/schemas/common';
import { positionGroupSchema } from '@/lib/api/schemas/player';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';

export const mockSquadEntrySchema = z.object({
  playerId: idSchema,
  name: z.string().min(1),
  slot: z
    .number()
    .int()
    .min(0)
    .max(SQUAD_SIZE - 1),
  position: positionGroupSchema,
  aliases: z.array(z.string().min(1)).min(1),
});

export const mockSquadSchema = z
  .array(mockSquadEntrySchema)
  .length(SQUAD_SIZE)
  .refine(
    (squad) => new Set(squad.map((entry) => entry.slot)).size === SQUAD_SIZE,
    { error: 'Every squad slot must be filled exactly once' },
  );

export type MockSquadEntry = z.infer<typeof mockSquadEntrySchema>;
export type MockSquad = z.infer<typeof mockSquadSchema>;
