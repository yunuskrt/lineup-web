import type { z } from 'zod';
import type { filterOptionsSchema } from '@/lib/api/schemas/catalog';

export type FilterOptions = z.infer<typeof filterOptionsSchema>;
