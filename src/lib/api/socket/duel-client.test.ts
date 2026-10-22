import { io, type Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NETWORK_ERROR } from '@/lib/api/http/transport';
import { PROTOCOL_VERSION } from '@/lib/api/protocol';
import { createSocketDuelClient } from '@/lib/api/socket/duel-client';
import type { ApiError, ApiResult } from '@/types/api';
import type { GatewayToken } from '@/types/auth';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));

type Handler = (...args: unknown[]) => void;
type Options = { auth: (send: (data: object) => void) => void };

// Stands in for socket.io-client; tests drive it
class FakeSocket {
  readonly handlers = new Map<string, Handler[]>();
  readonly managerHandlers = new Map<string, Handler[]>();
  readonly emits: { event: string; args: unknown[] }[] = [];
  ack: () => Promise<unknown> = async () => ({ success: true, data: null });
  active = false;

  readonly io = {
    on: (event: string, handler: Handler) => {
      this.managerHandlers.set(event, [
        ...(this.managerHandlers.get(event) ?? []),
        handler,
      ]);
    },
    removeAllListeners: () => this.managerHandlers.clear(),
  };

  constructor(
    readonly url: string,
    readonly options: Options & Record<string, unknown>,
  ) {}

  on(event: string, handler: Handler) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
    return this;
  }

  removeAllListeners() {
    this.handlers.clear();
    return this;
  }

  connect() {
    this.active = true;
    return this;
  }

  disconnect() {
    this.active = false;
    return this;
  }

  timeout() {
    return {
      emitWithAck: async (event: string, ...args: unknown[]) => {
        this.emits.push({ event, args });
        return this.ack();
      },
    };
  }

  fire(event: string, ...args: unknown[]) {
    for (const handler of this.handlers.get(event) ?? []) handler(...args);
  }

  fireManager(event: string) {
    for (const handler of this.managerHandlers.get(event) ?? []) handler();
  }
}

const URL = 'http://localhost:8080';
const ELSEWHERE: ApiError = {
  code: 'forbidden',
  message: "You're connected somewhere else.",
  retryAfterMs: null,
};

function apiError(code: ApiError['code'], message = 'Refused.'): ApiError {
  return { code, message, retryAfterMs: null };
}

// What the server puts in `connect_error`
function refusal(code: ApiError['code']) {
  return Object.assign(new Error(code), {
    data: { success: false, error: apiError(code) },
  });
}

describe('createSocketDuelClient', () => {
  let sockets: FakeSocket[];
  let tokenCount: number;
  const getToken = vi.fn<() => Promise<ApiResult<GatewayToken>>>();

  function client() {
    return createSocketDuelClient(URL, getToken);
  }

  function latest(): FakeSocket {
    const socket = sockets.at(-1);
    if (!socket) throw new Error('No socket was created');
    return socket;
  }

  // Socket.IO calls `auth` once the transport opens
  async function authenticate(socket: FakeSocket): Promise<object | null> {
    let sent: object | null = null;
    socket.options.auth((data) => {
      sent = data;
    });
    await vi.advanceTimersByTimeAsync(0);
    return sent;
  }

  async function accept(socket: FakeSocket) {
    await authenticate(socket);
    socket.fire('connect');
    await vi.advanceTimersByTimeAsync(0);
  }

  async function refuse(socket: FakeSocket, code: ApiError['code']) {
    await authenticate(socket);
    socket.active = false;
    socket.fire('connect_error', refusal(code));
    await vi.advanceTimersByTimeAsync(0);
  }

  async function connected() {
    const duel = client();
    const result = duel.connect();
    await accept(latest());
    expect(await result).toEqual({ success: true, data: undefined });
    return duel;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    sockets = [];
    tokenCount = 0;
    getToken.mockReset();
    getToken.mockImplementation(async () => {
      tokenCount += 1;
      return {
        success: true,
        data: { token: `token-${tokenCount}`, expiresAt: 1 },
      };
    });
    vi.mocked(io).mockImplementation(((url: string, options: Options) => {
      const socket = new FakeSocket(url, options);
      sockets.push(socket);
      return socket as unknown as Socket;
    }) as unknown as typeof io);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('connect', () => {
    it('sends a fresh token and the version, nothing else', async () => {
      const duel = client();
      const result = duel.connect();
      const socket = latest();

      expect(socket.url).toBe(URL);
      expect(socket.options).toMatchObject({
        autoConnect: false,
        forceNew: true,
        reconnectionAttempts: 5,
      });
      expect(socket.options).not.toHaveProperty('withCredentials');
      expect(await authenticate(socket)).toEqual({
        token: 'token-1',
        protocolVersion: PROTOCOL_VERSION,
      });

      socket.fire('connect');
      expect(await result).toEqual({ success: true, data: undefined });
    });

    it('retries an auth refusal once, with a new token', async () => {
      const result = client().connect();
      await refuse(latest(), 'unauthorized');
      expect(sockets).toHaveLength(2);
      await refuse(latest(), 'unauthorized');

      const final = await result;
      expect(final.success).toBe(false);
      if (!final.success) expect(final.error.code).toBe('unauthorized');
      expect(sockets).toHaveLength(2);
      expect(getToken).toHaveBeenCalledTimes(2);
    });

    it('connects when the auth retry succeeds', async () => {
      const result = client().connect();
      await refuse(latest(), 'unauthorized');
      await accept(latest());
      expect((await result).success).toBe(true);
    });

    it('backs off a server error twice, then gives up', async () => {
      const result = client().connect();
      await refuse(latest(), 'server_error');

      await vi.advanceTimersByTimeAsync(999);
      expect(sockets).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(sockets).toHaveLength(2);

      await refuse(latest(), 'server_error');
      await vi.advanceTimersByTimeAsync(2_000);
      expect(sockets).toHaveLength(3);
      await refuse(latest(), 'server_error');

      const final = await result;
      if (final.success) throw new Error('Expected a failure');
      expect(final.error.code).toBe('server_error');
      expect(sockets).toHaveLength(3);
    });

    it('never retries an out-of-date build', async () => {
      const result = client().connect();
      await refuse(latest(), 'protocol_refused');

      const final = await result;
      if (final.success) throw new Error('Expected a failure');
      expect(final.error.code).toBe('protocol_refused');
      await vi.advanceTimersByTimeAsync(10_000);
      expect(sockets).toHaveLength(1);
    });

    it('returns a failed token call as is, with no retry', async () => {
      const lost = apiError(
        'unauthorized',
        'Sign in or continue as a guest first.',
      );
      getToken.mockResolvedValueOnce({ success: false, error: lost });
      const result = client().connect();
      await authenticate(latest());

      expect(await result).toEqual({ success: false, error: lost });
      expect(latest().active).toBe(false);
      expect(sockets).toHaveLength(1);
    });

    it('treats a transport failure as network, with no retry', async () => {
      const result = client().connect();
      latest().fire('connect_error', new Error('xhr poll error'));

      expect(await result).toEqual({ success: false, error: NETWORK_ERROR });
      expect(latest().active).toBe(false);
    });

    it('gives up as network after 10 seconds', async () => {
      const result = client().connect();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await result).toEqual({ success: false, error: NETWORK_ERROR });
    });

    it('stops retrying once disconnected', async () => {
      const duel = client();
      const result = duel.connect();
      await refuse(latest(), 'server_error');
      duel.disconnect();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(await result).toEqual({ success: false, error: NETWORK_ERROR });
      expect(sockets).toHaveLength(1);
    });
  });

  describe('closing', () => {
    it('passes on a takeover and never reconnects', async () => {
      const duel = await connected();
      const onClose = vi.fn();
      const onError = vi.fn();
      duel.onClose(onClose);
      duel.on('error', onError);

      latest().fire('error', ELSEWHERE);
      latest().fire('disconnect', 'io server disconnect');

      expect(onError).toHaveBeenCalledWith(ELSEWHERE);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledWith(ELSEWHERE);
      expect(latest().active).toBe(false);
      await vi.advanceTimersByTimeAsync(30_000);
      expect(sockets).toHaveLength(1);
    });

    it('stays quiet on a dropped transport, then closes on give-up', async () => {
      const duel = await connected();
      const onClose = vi.fn();
      duel.onClose(onClose);

      latest().fire('disconnect', 'transport close');
      latest().fire('connect_error', new Error('xhr poll error'));
      expect(onClose).not.toHaveBeenCalled();

      latest().fireManager('reconnect_failed');
      expect(onClose).toHaveBeenCalledWith(NETWORK_ERROR);
    });

    it('closes when a reconnect is refused', async () => {
      const duel = await connected();
      const onClose = vi.fn();
      duel.onClose(onClose);

      latest().active = false;
      latest().fire('connect_error', refusal('protocol_refused'));
      expect(onClose).toHaveBeenCalledWith(apiError('protocol_refused'));
    });

    it('closes when a reconnect cannot get a token', async () => {
      const duel = await connected();
      const onClose = vi.fn();
      duel.onClose(onClose);
      const lost = apiError('unauthorized');
      getToken.mockResolvedValueOnce({ success: false, error: lost });

      expect(await authenticate(latest())).toBeNull();
      expect(onClose).toHaveBeenCalledWith(lost);
    });

    it('ignores a stale token call once a newer connect began', async () => {
      const duel = await connected();
      const onClose = vi.fn();
      duel.onClose(onClose);
      const stale = latest();

      let fail: (result: ApiResult<GatewayToken>) => void = () => {};
      getToken.mockImplementationOnce(
        () => new Promise((resolve) => (fail = resolve)),
      );
      stale.options.auth(() => {});
      const again = duel.connect();
      const fresh = latest();
      fail({ success: false, error: apiError('unauthorized') });
      await vi.advanceTimersByTimeAsync(0);

      expect(onClose).not.toHaveBeenCalled();
      expect(fresh.active).toBe(true);
      await accept(fresh);
      expect((await again).success).toBe(true);
    });

    it('fires nothing when the player disconnects', async () => {
      const duel = await connected();
      const onClose = vi.fn();
      duel.onClose(onClose);
      const socket = latest();

      duel.disconnect();
      socket.fire('disconnect', 'io client disconnect');
      expect(onClose).not.toHaveBeenCalled();
      expect(socket.active).toBe(false);
    });
  });

  describe('transport changes', () => {
    async function watched() {
      const duel = await connected();
      const changes: string[] = [];
      duel.onConnection((change) => changes.push(change));
      return { duel, changes };
    }

    it.each(['transport close', 'ping timeout', 'transport error'])(
      'reports a %s as dropped, then the reconnect',
      async (reason) => {
        const { changes } = await watched();

        latest().fire('disconnect', reason);
        expect(changes).toEqual(['dropped']);

        await accept(latest());
        expect(changes).toEqual(['dropped', 'restored']);
        // The same socket: Socket.IO reconnected it
        expect(sockets).toHaveLength(1);
      },
    );

    it('never reports the first connect', async () => {
      const duel = client();
      const changes: string[] = [];
      duel.onConnection((change) => changes.push(change));
      const result = duel.connect();
      await accept(latest());
      await result;
      expect(changes).toEqual([]);
    });

    it('reports neither for a takeover', async () => {
      const { duel, changes } = await watched();
      duel.onClose(() => {});
      latest().fire('disconnect', 'io server disconnect');
      expect(changes).toEqual([]);
    });

    it('reports neither when the player disconnects', async () => {
      const { duel, changes } = await watched();
      const socket = latest();
      duel.disconnect();
      socket.fire('disconnect', 'io client disconnect');
      expect(changes).toEqual([]);
    });

    it('stops reporting once unsubscribed', async () => {
      const duel = await connected();
      const changes: string[] = [];
      const unsubscribe = duel.onConnection((change) => changes.push(change));
      unsubscribe();
      latest().fire('disconnect', 'transport close');
      expect(changes).toEqual([]);
    });
  });

  describe('events', () => {
    it('passes a valid payload on and drops a bad one', async () => {
      const drift = vi.spyOn(console, 'error').mockImplementation(() => {});
      const duel = await connected();
      const onQueued = vi.fn();
      duel.on('queued', onQueued);

      latest().fire('queued', { phase: 'queued', since: 5 });
      latest().fire('queued', { phase: 'queued', since: 'soon' });

      expect(onQueued).toHaveBeenCalledTimes(1);
      expect(onQueued).toHaveBeenCalledWith({ phase: 'queued', since: 5 });
      expect(drift).toHaveBeenCalledWith('[api] socket queued: bad response', [
        'since',
      ]);
    });

    it('keeps handlers across a new socket', async () => {
      const duel = await connected();
      const onQueued = vi.fn();
      duel.on('queued', onQueued);

      const again = duel.connect();
      await accept(latest());
      await again;
      latest().fire('queued', { phase: 'queued', since: 9 });

      expect(onQueued).toHaveBeenCalledWith({ phase: 'queued', since: 9 });
    });
  });

  describe('commands', () => {
    it('sends commands with an ack, and none with an empty payload', async () => {
      const duel = await connected();
      const filters = {
        competitionIds: [],
        clubIds: [],
        era: { from: 2000, to: 2025 },
      };
      const guess = { sessionId: 'duel-1', guess: 'Pirlo' };

      await duel.enterQueue();
      await duel.leaveQueue();
      await duel.submitFilters(filters);
      await duel.guess(guess);
      await duel.forfeit();

      expect(latest().emits).toEqual([
        { event: 'queue:enter', args: [] },
        { event: 'queue:leave', args: [] },
        { event: 'filters:submit', args: [filters] },
        { event: 'duel:guess', args: [guess] },
        { event: 'duel:forfeit', args: [] },
      ]);
    });

    it("returns the server's refusal from the ack", async () => {
      const duel = await connected();
      const closed = apiError('forbidden', "Duels aren't open yet.");
      latest().ack = async () => ({ success: false, error: closed });

      expect(await duel.enterQueue()).toEqual({
        success: false,
        error: closed,
      });
    });

    it('treats a missing ack as network', async () => {
      const duel = await connected();
      latest().ack = async () => {
        throw new Error('operation has timed out');
      };

      expect(await duel.enterQueue()).toEqual({
        success: false,
        error: NETWORK_ERROR,
      });
    });

    it('fails as network before any connect', async () => {
      expect(await client().enterQueue()).toEqual({
        success: false,
        error: NETWORK_ERROR,
      });
    });
  });
});
