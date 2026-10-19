import { afterEach, describe, expect, it, vi } from 'vitest';
import { scenarioFrom } from '@/lib/api/register';

describe('scenarioFrom', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads a known scenario from the query', () => {
    expect(scenarioFrom('?scenario=rateLimited')).toBe('rateLimited');
    expect(scenarioFrom('?state=idle&scenario=youDisconnect')).toBe(
      'youDisconnect',
    );
  });

  it('ignores an unknown or missing name', () => {
    expect(scenarioFrom('?scenario=nope')).toBeUndefined();
    expect(scenarioFrom('')).toBeUndefined();
  });

  it('ignores the query in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(scenarioFrom('?scenario=rateLimited')).toBeUndefined();
  });
});

describe('registerApiClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function freshRegistry() {
    vi.resetModules();
    const { registerApiClient } = await import('@/lib/api/register');
    const { getApiClient } = await import('@/lib/api/client');
    const { getDuelClient } = await import('@/lib/api/duel-client');
    return { registerApiClient, getApiClient, getDuelClient };
  }

  it('registers the HTTP client in real mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_MODE', 'real');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:8080');
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response('{"success":true,"data":null}'),
    );
    vi.stubGlobal('fetch', fetchMock);

    const registry = await freshRegistry();
    registry.registerApiClient();
    const session = await registry.getApiClient().auth.getSession();

    expect(session).toEqual({ success: true, data: null });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://localhost:8080/auth/session',
    );
  });

  it('registers the socket duel client without connecting', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_MODE', 'real');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:8080');
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const registry = await freshRegistry();
    registry.registerApiClient();
    const duel = registry.getDuelClient();
    const unsubscribe = duel.onClose(() => {});

    expect(typeof unsubscribe).toBe('function');
    expect(() => duel.disconnect()).not.toThrow();
    // No token is fetched until a duel connects
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registers once, however often it is called', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_MODE', 'real');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:8080');

    const registry = await freshRegistry();
    registry.registerApiClient();
    const first = registry.getApiClient();
    registry.registerApiClient();

    expect(registry.getApiClient()).toBe(first);
  });

  it('stops at startup in real mode without a URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_MODE', 'real');
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');

    const registry = await freshRegistry();
    expect(() => registry.registerApiClient()).toThrow(
      'NEXT_PUBLIC_API_URL is missing',
    );
  });

  it('registers the mock in mock mode, with no URL needed', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_MODE', 'mock');
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');

    const registry = await freshRegistry();
    registry.registerApiClient();
    const result = await registry.getApiClient().auth.continueAsGuest();

    expect(result.success).toBe(true);
  });
});
