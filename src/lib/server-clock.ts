export type ServerClock = {
  now(): number;
  // A server instant read when the request arrived
  sample(serverInstant: number, sentAt: number, receivedAt: number): void;
};

// Server time for countdowns; decides nothing
export function createServerClock(localNow = () => Date.now()): ServerClock {
  let offset = 0;
  let bestRoundTrip = Number.POSITIVE_INFINITY;

  return {
    now: () => localNow() + offset,
    sample(serverInstant, sentAt, receivedAt) {
      const roundTrip = receivedAt - sentAt;
      // The shortest round trip has the least error
      if (roundTrip < 0 || roundTrip >= bestRoundTrip) return;
      bestRoundTrip = roundTrip;
      offset = serverInstant - (sentAt + receivedAt) / 2;
    },
  };
}

export const serverClock = createServerClock();

export type RoundTrip = {
  start(): void;
  // One sample per start; a stray reply is dropped
  finish(serverInstant: number): void;
};

// Times a request until its reply lands
export function createRoundTrip(
  clock: ServerClock,
  localNow = () => Date.now(),
): RoundTrip {
  let sentAt: number | null = null;

  return {
    start() {
      sentAt = localNow();
    },
    finish(serverInstant) {
      if (sentAt === null) return;
      clock.sample(serverInstant, sentAt, localNow());
      sentAt = null;
    },
  };
}
