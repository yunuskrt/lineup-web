import { z } from 'zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BAD_RESPONSE_ERROR,
  createTransport,
  NETWORK_ERROR,
} from '@/lib/api/http/transport';

const BASE_URL = 'http://localhost:8080';
const dataSchema = z.object({ name: z.string() });

const fetchMock = vi.fn<typeof fetch>();

function respondWith(body: string, status = 200) {
  fetchMock.mockResolvedValueOnce(new Response(body, { status }));
}

function lastCall(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls.at(-1) ?? [];
  return { url: String(url), init: init ?? {} };
}

describe('createTransport', () => {
  const request = createTransport(BASE_URL);

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends credentials, and no body or headers without one', async () => {
    respondWith('{"success":true,"data":{"name":"a"}}');
    await request('GET', '/profile', dataSchema);

    const { url, init } = lastCall();
    expect(url).toBe('http://localhost:8080/profile');
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('include');
    expect(init.cache).toBe('no-store');
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeUndefined();
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('sends a JSON body with its content type', async () => {
    respondWith('{"success":true,"data":{"name":"a"}}');
    await request('POST', '/auth/sign-in', dataSchema, {
      body: { email: 'a@b.co' },
    });

    const { init } = lastCall();
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.body).toBe('{"email":"a@b.co"}');
  });

  it('skips null and undefined query values', async () => {
    respondWith('{"success":true,"data":{"name":"a"}}');
    await request('GET', '/profile/history', dataSchema, {
      query: { cursor: null, limit: 20, other: undefined },
    });

    expect(lastCall().url).toBe(
      'http://localhost:8080/profile/history?limit=20',
    );
  });

  it('returns the parsed data on success', async () => {
    respondWith('{"success":true,"data":{"name":"a","extra":1}}');
    const result = await request('GET', '/x', dataSchema);
    expect(result).toEqual({ success: true, data: { name: 'a' } });
  });

  it('accepts null data for an empty result', async () => {
    respondWith('{"success":true,"data":null}');
    const result = await request('POST', '/auth/sign-out', z.null());
    expect(result).toEqual({ success: true, data: null });
  });

  it('passes a failure envelope through, whatever the status', async () => {
    const error = {
      code: 'rate_limited',
      message: 'Slow down.',
      retryAfterMs: 1_500,
    };
    respondWith(JSON.stringify({ success: false, error }), 429);
    const result = await request('POST', '/x', dataSchema);
    expect(result).toEqual({ success: false, error });
  });

  it('keeps emptyBecause on an empty pool', async () => {
    const error = {
      code: 'empty_pool',
      message: 'No matches.',
      retryAfterMs: null,
      emptyBecause: 'club',
    };
    respondWith(JSON.stringify({ success: false, error }), 422);
    const result = await request('POST', '/solo/sessions', dataSchema);
    expect(result).toEqual({ success: false, error });
  });

  it('returns network when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const result = await request('GET', '/x', dataSchema);
    expect(result).toEqual({ success: false, error: NETWORK_ERROR });
  });

  it('returns network on a timeout', async () => {
    fetchMock.mockRejectedValueOnce(
      new DOMException('The operation timed out.', 'TimeoutError'),
    );
    const result = await request('GET', '/x', dataSchema);
    expect(result).toEqual({ success: false, error: NETWORK_ERROR });
  });

  it('returns network when the body cannot be read', async () => {
    const response = new Response('{}');
    vi.spyOn(response, 'text').mockRejectedValueOnce(new Error('aborted'));
    fetchMock.mockResolvedValueOnce(response);
    const result = await request('GET', '/x', dataSchema);
    expect(result).toEqual({ success: false, error: NETWORK_ERROR });
  });

  it('returns server_error for a body that is not JSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    respondWith('<html>Bad gateway</html>', 502);
    const result = await request('GET', '/x', dataSchema);
    expect(result).toEqual({ success: false, error: BAD_RESPONSE_ERROR });
  });

  it('returns server_error and logs paths only on drift', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    respondWith('{"success":true,"data":{"name":42,"secret":"Xavi"}}');
    const result = await request('GET', '/profile', dataSchema);

    expect(result).toEqual({ success: false, error: BAD_RESPONSE_ERROR });
    expect(log).toHaveBeenCalledWith('[api] GET /profile: bad response', [
      'data.name',
    ]);
    expect(JSON.stringify(log.mock.calls)).not.toContain('Xavi');
  });

  it('treats a failure envelope with a bad error as drift', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    respondWith('{"success":false,"error":{"code":"teapot"}}', 418);
    const result = await request('GET', '/x', dataSchema);
    expect(result).toEqual({ success: false, error: BAD_RESPONSE_ERROR });
  });

  it('logs nothing in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    respondWith('not json');
    await request('GET', '/x', dataSchema);
    expect(log).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
