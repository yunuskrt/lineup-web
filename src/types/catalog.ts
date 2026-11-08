import type { z } from 'zod';
import type {
  competitionOptionSchema,
  directoryPlayerSchema,
  filterOptionsSchema,
  playerDirectorySchema,
} from '@/lib/api/schemas/catalog';

export type CompetitionOption = z.infer<typeof competitionOptionSchema>;
export type FilterOptions = z.infer<typeof filterOptionsSchema>;
export type DirectoryPlayer = z.infer<typeof directoryPlayerSchema>;
export type PlayerDirectory = z.infer<typeof playerDirectorySchema>;
