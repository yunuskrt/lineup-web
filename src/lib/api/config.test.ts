import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveApiUrl } from '@/lib/api/config';

describe('resolveApiUrl', () => {
  it('accepts an http(s) origin', () => {
    expect(resolveApiUrl('http://localhost:8080', false)).toBe(
      'http://localhost:8080',
    );
    expect(resolveApiUrl('https://api.lineup.gg', true)).toBe(
      'https://api.lineup.gg',
    );
  });

  it('names the variable when it is missing', () => {
    expect(() => resolveApiUrl(undefined, false)).toThrow(
      'NEXT_PUBLIC_API_URL is missing',
    );
    expect(() => resolveApiUrl('', false)).toThrow('is missing');
  });

  it.each([
    'http://localhost:8080/',
    'http://localhost:8080/api',
    'http://localhost:8080?x=1',
  ])('refuses %s, which is not an origin', (raw) => {
    expect(() => resolveApiUrl(raw, false)).toThrow('must be an origin');
  });

  it.each(['localhost:8080', 'ftp://localhost:8080', 'not a url'])(
    'refuses %s, which is not http(s)',
    (raw) => {
      expect(() => resolveApiUrl(raw, false)).toThrow('must be an http(s) URL');
    },
  );

  it('refuses http in production only', () => {
    expect(() => resolveApiUrl('http://api.lineup.gg', true)).toThrow(
      'must use https in production',
    );
    expect(resolveApiUrl('http://api.lineup.gg', false)).toBe(
      'http://api.lineup.gg',
    );
  });

  it.each([
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://[::1]:8080',
  ])('allows a loopback %s in a production build', (raw) => {
    expect(resolveApiUrl(raw, true)).toBe(raw);
  });

  it('does not mistake a lookalike host for loopback', () => {
    expect(() => resolveApiUrl('http://localhost.evil.example', true)).toThrow(
      'must use https in production',
    );
  });
});

describe('API_MODE', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to mock and needs no URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_MODE', '');
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    const { API_MODE } = await import('@/lib/api/config');
    expect(API_MODE).toBe('mock');
  });

  it('reads real', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_MODE', 'real');
    const { API_MODE } = await import('@/lib/api/config');
    expect(API_MODE).toBe('real');
  });
});
