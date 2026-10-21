import { describe, expect, it } from 'vitest';
import {
  createRoundTrip,
  createServerClock,
  type ServerClock,
} from '@/lib/server-clock';

function clockAt(local: number) {
  let now = local;
  const clock = createServerClock(() => now);
  return {
    clock,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('createServerClock', () => {
  it('reads the local clock before any sample', () => {
    const { clock } = clockAt(1_000);
    expect(clock.now()).toBe(1_000);
  });

  it('shifts by the server instant minus the request midpoint', () => {
    const { clock } = clockAt(10_000);
    // Sent 9_900, back 10_000, server read 14_000
    clock.sample(14_000, 9_900, 10_000);
    expect(clock.now()).toBe(10_000 + (14_000 - 9_950));
  });

  it('follows the local clock after a sample', () => {
    const { clock, advance } = clockAt(10_000);
    clock.sample(14_000, 9_900, 10_000);
    advance(500);
    expect(clock.now()).toBe(10_500 + 4_050);
  });

  it('works when the browser is ahead of the server', () => {
    const { clock } = clockAt(10_000);
    clock.sample(7_000, 9_980, 10_000);
    expect(clock.now()).toBe(10_000 - 2_990);
  });

  it('keeps a fast sample over a slower one', () => {
    const { clock } = clockAt(10_000);
    clock.sample(14_000, 9_980, 10_000);
    clock.sample(20_000, 9_000, 10_000);
    expect(clock.now()).toBe(10_000 + (14_000 - 9_990));
  });

  it('replaces a slow sample with a faster one', () => {
    const { clock } = clockAt(10_000);
    clock.sample(20_000, 9_000, 10_000);
    clock.sample(14_000, 9_980, 10_000);
    expect(clock.now()).toBe(10_000 + (14_000 - 9_990));
  });

  it('ignores a sample whose reply came before its request', () => {
    const { clock } = clockAt(10_000);
    clock.sample(14_000, 10_100, 10_000);
    expect(clock.now()).toBe(10_000);
  });
});

describe('createRoundTrip', () => {
  it('samples a reply against its send time', () => {
    const { clock } = clockAt(10_000);
    let local = 9_900;
    const trip = createRoundTrip(clock, () => local);

    trip.start();
    local = 10_000;
    // The server read 14_000 between the two
    trip.finish(14_000);
    expect(clock.now()).toBe(10_000 + (14_000 - 9_950));
  });

  it('ignores a reply with no request out', () => {
    const { clock } = clockAt(10_000);
    const trip = createRoundTrip(clock, () => 10_000);

    trip.finish(14_000);
    expect(clock.now()).toBe(10_000);
  });

  it('samples each request once', () => {
    const samples: number[][] = [];
    const clock: ServerClock = {
      now: () => 0,
      sample: (...args) => {
        samples.push(args);
      },
    };
    let local = 9_900;
    const trip = createRoundTrip(clock, () => local);

    trip.start();
    local = 10_000;
    trip.finish(14_000);
    trip.finish(99_000);
    expect(samples).toEqual([[14_000, 9_900, 10_000]]);
  });
});
