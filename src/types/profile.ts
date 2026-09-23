import type { z } from 'zod';
import type {
  historyEntrySchema,
  historyPageSchema,
  historyQuerySchema,
  profileSchema,
  userStatsSchema,
} from '@/lib/api/schemas/profile';

export type UserStats = z.infer<typeof userStatsSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type GameMode = HistoryEntry['mode'];
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
export type HistoryPage = z.infer<typeof historyPageSchema>;
export type Profile = z.infer<typeof profileSchema>;
