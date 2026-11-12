import type { z } from 'zod';
import type { appConfigSchema } from '@/lib/api/schemas/config';

export type AppConfig = z.infer<typeof appConfigSchema>;
