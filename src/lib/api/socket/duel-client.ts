import { io, type Socket } from 'socket.io-client';
import type {
  ConnectionChange,
  DuelClient,
  DuelEvent,
} from '@/lib/api/duel-client';
import { createEmitter } from '@/lib/api/duel-emitter';
import { NETWORK_ERROR, reportDrift } from '@/lib/api/http/transport';
import { PROTOCOL_VERSION } from '@/lib/api/protocol';
import {
  ackResultOf,
  DUEL_EVENTS,
  handshakeRetryDelay,
  parseEvent,
  refusalOf,
} from '@/lib/api/socket/messages';
import type { ApiError, ApiErrorCode, ApiResult } from '@/types/api';
import type { GatewayToken } from '@/types/auth';

const CONNECT_TIMEOUT_MS = 10_000;
const ACK_TIMEOUT_MS = 10_000;
const RECONNECT_ATTEMPTS = 5;

const SERVER_CLOSED_ERROR: ApiError = {
  code: 'server_error',
  message: 'The duel server closed the connection.',
  retryAfterMs: null,
};

type GetToken = () => Promise<ApiResult<GatewayToken>>;
type CloseHandler = (error: ApiError) => void;
type ConnectionHandler = (change: ConnectionChange) => void;

// Token errors return as is; refusals may retry
type Attempt = { result: ApiResult<void>; isRefusal: boolean };

function failed(error: ApiError): ApiResult<void> {
  return { success: false, error };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createSocketDuelClient(
  baseUrl: string,
  getToken: GetToken,
): DuelClient {
  const emitter = createEmitter();
  const closeHandlers = new Set<CloseHandler>();
  const connectionHandlers = new Set<ConnectionHandler>();
  let socket: Socket | null = null;
  let settlePending: ((attempt: Attempt) => void) | null = null;
  let lastServerError: ApiError | null = null;
  // Bumped by disconnect, so a stale connect stops
  let generation = 0;

  function close(error: ApiError) {
    for (const handler of [...closeHandlers]) handler(error);
  }

  function report(change: ConnectionChange) {
    for (const handler of [...connectionHandlers]) handler(change);
  }

  function drop() {
    settlePending?.({ result: failed(NETWORK_ERROR), isRefusal: false });
    settlePending = null;
    if (!socket) return;
    socket.io.removeAllListeners();
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  // The connection is gone for good; say why once
  function end(error: ApiError) {
    drop();
    close(error);
  }

  function forward<E extends DuelEvent>(event: E, payload: unknown) {
    const parsed = parseEvent(event, payload);
    if (!parsed.success) {
      reportDrift(`socket ${event}`, parsed.paths);
      return;
    }
    if (event === 'error') lastServerError = parsed.payload as ApiError;
    emitter.emit(event, parsed.payload);
  }

  function open(): Promise<Attempt> {
    return new Promise((resolve) => {
      let isOpen = false;
      const timer = setTimeout(
        () => settle({ result: failed(NETWORK_ERROR), isRefusal: false }),
        CONNECT_TIMEOUT_MS,
      );

      function settle(attempt: Attempt) {
        clearTimeout(timer);
        if (settlePending !== settle) return;
        settlePending = null;
        if (!attempt.result.success) drop();
        resolve(attempt);
      }
      settlePending = settle;

      const next = io(baseUrl, {
        autoConnect: false,
        forceNew: true,
        reconnectionAttempts: RECONNECT_ATTEMPTS,
        // Runs per attempt, so a token is never reused
        auth: (send) => {
          void getToken().then((token) => {
            // A newer connect replaced this socket
            if (socket !== next) return;
            if (token.success) {
              send({
                token: token.data.token,
                protocolVersion: PROTOCOL_VERSION,
              });
            } else if (isOpen) {
              end(token.error);
            } else {
              settle({ result: failed(token.error), isRefusal: false });
            }
          });
        },
      });
      socket = next;

      for (const event of DUEL_EVENTS) {
        next.on(event, (payload: unknown) => forward(event, payload));
      }
      next.on('connect', () => {
        const isReturn = isOpen;
        isOpen = true;
        lastServerError = null;
        settle({ result: { success: true, data: undefined }, isRefusal: true });
        if (isReturn) report('restored');
      });
      next.on('connect_error', (err) => {
        if (!isOpen) {
          settle({ result: failed(refusalOf(err)), isRefusal: true });
          return;
        }
        // Still active: a dropped transport, retried
        if (!next.active) end(refusalOf(err));
      });
      next.on('disconnect', (reason) => {
        // Another tab took over; never reconnect alone
        if (reason === 'io server disconnect') {
          end(lastServerError ?? SERVER_CLOSED_ERROR);
        } else {
          // Ours never lands: `drop` detaches first
          report('dropped');
        }
      });
      next.io.on('reconnect_failed', () => end(NETWORK_ERROR));
      next.connect();
    });
  }

  async function send(
    event: string,
    ...args: unknown[]
  ): Promise<ApiResult<void>> {
    if (!socket) return failed(NETWORK_ERROR);
    try {
      const response: unknown = await socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck(event, ...args);
      return ackResultOf(response);
    } catch {
      return failed(NETWORK_ERROR);
    }
  }

  return {
    async connect() {
      drop();
      const current = generation;
      const retries: Partial<Record<ApiErrorCode, number>> = {};

      for (;;) {
        const { result, isRefusal } = await open();
        if (result.success || !isRefusal) return result;

        const { code } = result.error;
        const delay = handshakeRetryDelay(code, retries[code] ?? 0);
        if (delay === null) return result;
        retries[code] = (retries[code] ?? 0) + 1;
        await wait(delay);
        if (current !== generation) return failed(NETWORK_ERROR);
      }
    },

    disconnect() {
      generation += 1;
      drop();
    },

    // No payload means none: `{}` fails the server
    enterQueue: () => send('queue:enter'),
    leaveQueue: () => send('queue:leave'),
    submitFilters: (filters) => send('filters:submit', filters),
    guess: (request) => send('duel:guess', request),
    forfeit: () => send('duel:forfeit'),

    on: (event, handler) => emitter.on(event, handler),

    onClose(handler) {
      closeHandlers.add(handler);
      return () => {
        closeHandlers.delete(handler);
      };
    },

    onConnection(handler) {
      connectionHandlers.add(handler);
      return () => {
        connectionHandlers.delete(handler);
      };
    },
  };
}
