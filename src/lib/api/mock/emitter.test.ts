import { describe, expect, it, vi } from 'vitest';
import { createEmitter } from '@/lib/api/mock/emitter';

const QUEUED = { phase: 'queued', since: 1 } as const;

describe('createEmitter', () => {
  it('delivers a payload to every subscriber', () => {
    const emitter = createEmitter();
    const first = vi.fn();
    const second = vi.fn();

    emitter.on('queued', first);
    emitter.on('queued', second);
    emitter.emit('queued', QUEUED);

    expect(first).toHaveBeenCalledWith(QUEUED);
    expect(second).toHaveBeenCalledWith(QUEUED);
  });

  it('only delivers to the matching event', () => {
    const emitter = createEmitter();
    const handler = vi.fn();

    emitter.on('paired', handler);
    emitter.emit('queued', QUEUED);

    expect(handler).not.toHaveBeenCalled();
  });

  it('stops delivering after unsubscribe', () => {
    const emitter = createEmitter();
    const handler = vi.fn();

    const off = emitter.on('queued', handler);
    emitter.emit('queued', QUEUED);
    off();
    emitter.emit('queued', QUEUED);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('lets a handler unsubscribe itself mid-dispatch', () => {
    const emitter = createEmitter();
    const calls: string[] = [];

    const off = emitter.on('queued', () => {
      calls.push('first');
      off();
    });
    emitter.on('queued', () => calls.push('second'));

    emitter.emit('queued', QUEUED);
    emitter.emit('queued', QUEUED);

    expect(calls).toEqual(['first', 'second', 'second']);
  });

  it('drops every subscription on clear', () => {
    const emitter = createEmitter();
    const handler = vi.fn();

    emitter.on('queued', handler);
    emitter.clear();
    emitter.emit('queued', QUEUED);

    expect(handler).not.toHaveBeenCalled();
  });

  it('emitting with no subscribers is a no-op', () => {
    const emitter = createEmitter();
    expect(() => emitter.emit('queued', QUEUED)).not.toThrow();
  });
});
