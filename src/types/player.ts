import type { z } from 'zod';
import type {
  positionGroupSchema,
  revealedPlayerSchema,
} from '@/lib/api/schemas/player';

export type PositionGroup = z.infer<typeof positionGroupSchema>;
export type RevealedPlayer = z.infer<typeof revealedPlayerSchema>;
