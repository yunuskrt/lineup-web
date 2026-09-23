import { z } from 'zod';
import { userSchema } from '@/lib/api/schemas/user';

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_HANDLE_LENGTH = 3;
export const MAX_HANDLE_LENGTH = 24;

const emailSchema = z.email();

// Length only — the backend owns the password policy
const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH)
  .max(MAX_PASSWORD_LENGTH);

const handleSchema = z
  .string()
  .trim()
  .min(MIN_HANDLE_LENGTH)
  .max(MAX_HANDLE_LENGTH);

export const signInRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  handle: handleSchema,
});

export const upgradeGuestRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  handle: handleSchema,
});

export const sessionSchema = z.object({
  user: userSchema,
});
