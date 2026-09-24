// Named situations the duel screens must render but cannot reach by playing.
// W16's `?state=` override consumes these rather than reinventing them.
export const DUEL_SCENARIOS = [
  'queueTimeout',
  'opponentDisconnects',
  'opponentForfeits',
  'youDisconnect',
  'drawOnEleven',
  'rateLimited',
  'protocolRefused',
] as const;

export type DuelScenario = (typeof DUEL_SCENARIOS)[number];

export function isDuelScenario(value: string): value is DuelScenario {
  return (DUEL_SCENARIOS as readonly string[]).includes(value);
}
