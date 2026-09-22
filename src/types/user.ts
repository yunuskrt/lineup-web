import type { z } from 'zod';
import type { tierSchema, userSchema } from '@/lib/api/schemas/user';

export type Tier = z.infer<typeof tierSchema>;
export type User = z.infer<typeof userSchema>;
