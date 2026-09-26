import type { z } from 'zod';
import type {
  positionGroupSchema,
  revealedPlayerSchema,
} from '@/lib/api/schemas/player';
import type { DuelActor } from '@/types/duel';

export type PositionGroup = z.infer<typeof positionGroupSchema>;
export type RevealedPlayer = z.infer<typeof revealedPlayerSchema>;

// Solo players have no finder; always yours
export type FoundPlayer = RevealedPlayer & { foundBy?: DuelActor };
