import type { z } from 'zod';
import type {
  namedPlayerSchema,
  positionGroupSchema,
  revealedPlayerSchema,
} from '@/lib/api/schemas/player';
import type { DuelActor } from '@/types/duel';

export type PositionGroup = z.infer<typeof positionGroupSchema>;
export type RevealedPlayer = z.infer<typeof revealedPlayerSchema>;
export type NamedPlayer = z.infer<typeof namedPlayerSchema>;

// Solo players have no finder; always yours
export type FoundPlayer = RevealedPlayer & { foundBy?: DuelActor };
