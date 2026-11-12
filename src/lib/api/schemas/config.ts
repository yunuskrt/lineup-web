import { z } from 'zod';

// Backend R9: the switch only, never a grant
export const appConfigSchema = z.object({
  proEnabled: z.boolean(),
});
