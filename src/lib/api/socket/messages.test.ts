import { describe, expect, it } from 'vitest';
import { BAD_RESPONSE_ERROR, NETWORK_ERROR } from '@/lib/api/http/transport';
import {
  ackResultOf,
  DUEL_EVENTS,
  handshakeRetryDelay,
  parseEvent,
  refusalOf,
} from '@/lib/api/socket/messages';
import type { ApiError } from '@/types/api';

const OUT_OF_DATE: ApiError = {
  code: 'protocol_refused',
  message: 'This version of Lineup is out of date. Update to keep playing.',
  retryAfterMs: null,
};

// What socket.io-client hands to `connect_error`
function connectError(data?: unknown) {
  const error = new Error('refused');
  return data === undefined ? error : Object.assign(error, { data });
}

describe('refusalOf', () => {
  it('reads the error from the envelope in `data`', () => {
    const err = connectError({ success: false, error: OUT_OF_DATE });
    expect(refusalOf(err)).toEqual(OUT_OF_DATE);
  });

  it.each<ApiError['code']>(['unauthorized', 'server_error'])(
    'keeps %s as the server sent it',
    (code) => {
      const error: ApiError = { code, message: 'No.', retryAfterMs: null };
      expect(refusalOf(connectError({ success: false, error }))).toEqual(error);
    },
  );

  it('treats a transport failure, with no data, as network', () => {
    expect(refusalOf(connectError())).toBe(NETWORK_ERROR);
    expect(refusalOf('timeout')).toBe(NETWORK_ERROR);
  });

  it('treats a malformed envelope as a bad response', () => {
    expect(refusalOf(connectError({ code: 'nope' }))).toBe(BAD_RESPONSE_ERROR);
    expect(refusalOf(connectError({ success: true, data: null }))).toBe(
      BAD_RESPONSE_ERROR,
    );
  });
});

describe('ackResultOf', () => {
  it('turns a success with no data into an empty success', () => {
    expect(ackResultOf({ success: true, data: null })).toEqual({
      success: true,
      data: undefined,
    });
  });

  it('passes a refusal through', () => {
    const error: ApiError = {
      code: 'forbidden',
      message: "Duels aren't open yet.",
      retryAfterMs: null,
    };
    expect(ackResultOf({ success: false, error })).toEqual({
      success: false,
      error,
    });
  });

  it('treats any other shape as a bad response', () => {
    const bad = { success: false, error: BAD_RESPONSE_ERROR };
    expect(ackResultOf(undefined)).toEqual(bad);
    expect(ackResultOf({ success: true, data: { extra: 1 } })).toEqual(bad);
    expect(ackResultOf({ success: false, error: { code: 'x' } })).toEqual(bad);
  });
});

describe('parseEvent', () => {
  it('knows every event the duel screen listens to', () => {
    expect(DUEL_EVENTS).toHaveLength(15);
    expect(DUEL_EVENTS).toContain('error');
    expect(DUEL_EVENTS).toContain('matchReady');
  });

  it('passes a valid payload through', () => {
    expect(parseEvent('queued', { phase: 'queued', since: 1_000 })).toEqual({
      success: true,
      payload: { phase: 'queued', since: 1_000 },
    });
    expect(parseEvent('error', OUT_OF_DATE)).toEqual({
      success: true,
      payload: OUT_OF_DATE,
    });
  });

  it('drops an invalid payload, naming only the paths', () => {
    expect(parseEvent('queued', { phase: 'queued', since: 'soon' })).toEqual({
      success: false,
      paths: ['since'],
    });
  });
});

describe('handshakeRetryDelay', () => {
  it('retries an auth refusal once, at once', () => {
    expect(handshakeRetryDelay('unauthorized', 0)).toBe(0);
    expect(handshakeRetryDelay('unauthorized', 1)).toBeNull();
  });

  it('backs off a server error twice, then gives up', () => {
    expect(handshakeRetryDelay('server_error', 0)).toBe(1_000);
    expect(handshakeRetryDelay('server_error', 1)).toBe(2_000);
    expect(handshakeRetryDelay('server_error', 2)).toBeNull();
  });

  it.each<ApiError['code']>(['protocol_refused', 'network', 'forbidden'])(
    'never retries %s',
    (code) => {
      expect(handshakeRetryDelay(code, 0)).toBeNull();
    },
  );
});
