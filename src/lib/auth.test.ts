import { describe, expect, it } from 'vitest';
import {
  signInRequestSchema,
  signUpRequestSchema,
  upgradeGuestRequestSchema,
} from '@/lib/api/schemas/auth';
import {
  AUTH_ERROR_MESSAGES,
  AUTH_FIELD_MESSAGES,
  authErrorMessage,
  authErrorMessageOf,
  authFieldErrors,
  authModeFrom,
  signUpTarget,
} from '@/lib/auth';
import { ApiRequestError } from '@/lib/api/unwrap';
import type { ApiError, ApiErrorCode } from '@/types/api';
import type { Session } from '@/types/auth';

function apiError(
  code: ApiErrorCode,
  retryAfterMs: number | null = null,
): ApiError {
  return { code, message: `Backend says ${code}.`, retryAfterMs };
}

function sessionFor(isGuest: boolean): Session {
  return {
    user: { id: 'user-1', handle: 'keeper', isGuest, tier: 'free' },
  };
}

const VALID_SIGN_UP = {
  email: 'player@example.com',
  password: 'a-good-password',
  handle: 'keeper',
};

describe('authErrorMessage', () => {
  it('uses fixed copy for transport failures', () => {
    expect(authErrorMessage(apiError('network'))).toBe(
      AUTH_ERROR_MESSAGES.network,
    );
    expect(authErrorMessage(apiError('server_error'))).toBe(
      AUTH_ERROR_MESSAGES.serverError,
    );
  });

  it('rounds the retry delay up to whole seconds', () => {
    expect(authErrorMessage(apiError('rate_limited', 4_200))).toBe(
      'Too many attempts. Try again in 5 seconds.',
    );
    expect(authErrorMessage(apiError('rate_limited', 1_000))).toBe(
      'Too many attempts. Try again in 1 second.',
    );
    expect(authErrorMessage(apiError('rate_limited', 0))).toBe(
      'Too many attempts. Try again in 1 second.',
    );
  });

  it('says shortly when no retry delay is given', () => {
    expect(authErrorMessage(apiError('rate_limited'))).toBe(
      AUTH_ERROR_MESSAGES.rateLimitedSoon,
    );
  });

  it('shows the backend message for every other code', () => {
    const passthrough: ApiErrorCode[] = [
      'unauthorized',
      'forbidden',
      'not_found',
      'invalid_input',
      'empty_pool',
      'session_over',
    ];

    for (const code of passthrough) {
      expect(authErrorMessage(apiError(code))).toBe(`Backend says ${code}.`);
    }
  });
});

describe('authFieldErrors', () => {
  it('returns no errors for valid values', () => {
    expect(authFieldErrors(signUpRequestSchema, VALID_SIGN_UP)).toEqual({});
    expect(
      authFieldErrors(signInRequestSchema, {
        email: VALID_SIGN_UP.email,
        password: VALID_SIGN_UP.password,
      }),
    ).toEqual({});
  });

  it('flags an invalid or empty email', () => {
    for (const email of ['not-an-email', '']) {
      expect(
        authFieldErrors(signUpRequestSchema, { ...VALID_SIGN_UP, email }),
      ).toEqual({ email: AUTH_FIELD_MESSAGES.email });
    }
  });

  it('flags a password that is too short or too long', () => {
    expect(
      authFieldErrors(signInRequestSchema, {
        email: VALID_SIGN_UP.email,
        password: 'short',
      }),
    ).toEqual({ password: AUTH_FIELD_MESSAGES.passwordShort });

    expect(
      authFieldErrors(signInRequestSchema, {
        email: VALID_SIGN_UP.email,
        password: 'x'.repeat(129),
      }),
    ).toEqual({ password: AUTH_FIELD_MESSAGES.passwordLong });
  });

  it('flags a handle that is short, long or only whitespace', () => {
    for (const handle of ['ab', 'x'.repeat(25), '     ']) {
      expect(
        authFieldErrors(upgradeGuestRequestSchema, {
          ...VALID_SIGN_UP,
          handle,
        }),
      ).toEqual({ handle: AUTH_FIELD_MESSAGES.handle });
    }
  });

  it('flags a field that is missing entirely', () => {
    expect(
      authFieldErrors(signUpRequestSchema, {
        email: VALID_SIGN_UP.email,
        password: VALID_SIGN_UP.password,
      }),
    ).toEqual({ handle: AUTH_FIELD_MESSAGES.handle });
  });

  it('ignores fields the schema does not ask for', () => {
    expect(
      authFieldErrors(signInRequestSchema, {
        email: VALID_SIGN_UP.email,
        password: VALID_SIGN_UP.password,
        handle: 'x',
      }),
    ).toEqual({});
  });

  it('reports one plain message per field when several fail', () => {
    expect(
      authFieldErrors(signUpRequestSchema, {
        email: '',
        password: '',
        handle: '',
      }),
    ).toEqual({
      email: AUTH_FIELD_MESSAGES.email,
      password: AUTH_FIELD_MESSAGES.passwordShort,
      handle: AUTH_FIELD_MESSAGES.handle,
    });
  });
});

describe('signUpTarget', () => {
  it('upgrades a guest so their history survives', () => {
    expect(signUpTarget(sessionFor(true))).toBe('upgradeGuest');
  });

  it('signs up when signed out or already registered', () => {
    expect(signUpTarget(null)).toBe('signUp');
    expect(signUpTarget(sessionFor(false))).toBe('signUp');
  });
});

describe('authErrorMessageOf', () => {
  it('maps an api error through authErrorMessage', () => {
    const error = new ApiRequestError(apiError('unauthorized'));
    expect(authErrorMessageOf(error)).toBe('Backend says unauthorized.');
  });

  it('falls back to server error copy for anything else', () => {
    for (const error of [new Error('boom'), 'boom', undefined]) {
      expect(authErrorMessageOf(error)).toBe(AUTH_ERROR_MESSAGES.serverError);
    }
  });
});

describe('authModeFrom', () => {
  it('reads sign-up and defaults everything else to sign-in', () => {
    expect(authModeFrom('sign-up')).toBe('sign-up');
    expect(authModeFrom('sign-in')).toBe('sign-in');
    expect(authModeFrom(undefined)).toBe('sign-in');
    expect(authModeFrom('SIGN-UP')).toBe('sign-in');
    expect(authModeFrom(['sign-up', 'sign-in'])).toBe('sign-in');
  });
});
