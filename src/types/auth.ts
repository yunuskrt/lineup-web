import type { z } from 'zod';
import type {
  sessionSchema,
  signInRequestSchema,
  signUpRequestSchema,
  upgradeGuestRequestSchema,
} from '@/lib/api/schemas/auth';

export type SignInRequest = z.infer<typeof signInRequestSchema>;
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;
export type UpgradeGuestRequest = z.infer<typeof upgradeGuestRequestSchema>;
export type Session = z.infer<typeof sessionSchema>;
