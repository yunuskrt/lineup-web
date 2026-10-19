import { z } from 'zod';
import { epochMsSchema } from '@/lib/api/schemas/game';
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

// The backend's rule, also its users_handle_check
export const HANDLE_PATTERN = /^[A-Za-z0-9_.-]+$/;

const handleSchema = z
  .string()
  .trim()
  .min(MIN_HANDLE_LENGTH)
  .max(MAX_HANDLE_LENGTH)
  .regex(HANDLE_PATTERN);

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

// Short-lived; fresh for every handshake
export const gatewayTokenSchema = z.object({
  token: z.string().min(1),
  expiresAt: epochMsSchema,
});
