import type { z } from 'zod';
import {
  MAX_HANDLE_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_HANDLE_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@/lib/api/schemas/auth';
import type { ApiError } from '@/types/api';
import type {
  AuthField,
  AuthFieldErrors,
  AuthFieldValues,
  AuthRequestSchema,
  Session,
  SignUpTarget,
} from '@/types/auth';

export const AUTH_FIELD_MESSAGES = {
  email: 'Enter a valid email address.',
  passwordShort: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  passwordLong: `Use at most ${MAX_PASSWORD_LENGTH} characters.`,
  handle: `Use ${MIN_HANDLE_LENGTH} to ${MAX_HANDLE_LENGTH} characters.`,
} as const;

export const AUTH_ERROR_MESSAGES = {
  network: "Couldn't reach Lineup. Check your connection and try again.",
  serverError: 'Something went wrong on our side. Try again in a moment.',
  rateLimitedSoon: 'Too many attempts. Try again shortly.',
} as const;

export function authErrorMessage(error: ApiError): string {
  switch (error.code) {
    case 'network':
      return AUTH_ERROR_MESSAGES.network;
    case 'server_error':
      return AUTH_ERROR_MESSAGES.serverError;
    case 'rate_limited':
      return rateLimitedMessage(error.retryAfterMs);
    default:
      return error.message;
  }
}

function rateLimitedMessage(retryAfterMs: number | null): string {
  if (retryAfterMs === null) return AUTH_ERROR_MESSAGES.rateLimitedSoon;

  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  const unit = seconds === 1 ? 'second' : 'seconds';
  return `Too many attempts. Try again in ${seconds} ${unit}.`;
}

export function authFieldErrors(
  schema: AuthRequestSchema,
  values: AuthFieldValues,
): AuthFieldErrors {
  const parsed = schema.safeParse(values);
  if (parsed.success) return {};

  const errors: AuthFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (!isAuthField(field) || errors[field]) continue;
    errors[field] = fieldMessage(field, issue);
  }
  return errors;
}

function isAuthField(key: unknown): key is AuthField {
  return key === 'email' || key === 'password' || key === 'handle';
}

function fieldMessage(field: AuthField, issue: z.core.$ZodIssue): string {
  if (field === 'email') return AUTH_FIELD_MESSAGES.email;
  if (field === 'handle') return AUTH_FIELD_MESSAGES.handle;
  return issue.code === 'too_big'
    ? AUTH_FIELD_MESSAGES.passwordLong
    : AUTH_FIELD_MESSAGES.passwordShort;
}

export function signUpTarget(session: Session | null): SignUpTarget {
  return session?.user.isGuest ? 'upgradeGuest' : 'signUp';
}
