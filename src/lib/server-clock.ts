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
