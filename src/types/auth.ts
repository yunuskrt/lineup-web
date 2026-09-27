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

export type AuthRequestSchema =
  | typeof signInRequestSchema
  | typeof signUpRequestSchema
  | typeof upgradeGuestRequestSchema;

export type AuthField = 'email' | 'password' | 'handle';
export type AuthFieldValues = Partial<Record<AuthField, string>>;
export type AuthFieldErrors = Partial<Record<AuthField, string>>;
export type SignUpTarget = 'signUp' | 'upgradeGuest';
