import { afterEach, describe, expect, it, vi } from 'vitest';
import { wait } from '@/lib/wait';

describe('wait', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves only once the time has passed', async () => {
    vi.useFakeTimers();
    let isDone = false;
    const waiting = wait(500).then(() => {
      isDone = true;
    });
    await vi.advanceTimersByTimeAsync(499);
    expect(isDone).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await waiting;
    expect(isDone).toBe(true);
  });
});
