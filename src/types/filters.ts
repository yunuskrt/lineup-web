import type { z } from 'zod';
import type { eraRangeSchema, filtersSchema } from '@/lib/api/schemas/common';

export type EraRange = z.infer<typeof eraRangeSchema>;
export type Filters = z.infer<typeof filtersSchema>;
