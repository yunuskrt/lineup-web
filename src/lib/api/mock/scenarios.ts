// Duel states unreachable by play; used by ?state=
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
