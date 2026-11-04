import type { z } from 'zod';
import type {
  competitionOptionSchema,
  filterOptionsSchema,
} from '@/lib/api/schemas/catalog';

export type CompetitionOption = z.infer<typeof competitionOptionSchema>;
export type FilterOptions = z.infer<typeof filterOptionsSchema>;
