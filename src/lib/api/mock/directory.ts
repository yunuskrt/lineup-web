import { PLAYERS } from '@/lib/api/mock/data/players';
import type { MockPlayer } from '@/lib/api/mock/types';
import type { PlayerDirectory } from '@/types/catalog';

const KEY_BYTES = 16;

// cyrb128: four 32-bit lanes, no collisions here
function hash128(input: string): number[] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ code, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ code, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ code, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ code, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1, h2, h3, h4].map((lane) => lane >>> 0);
}

function toBase64Url(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Hashed so keys don't sort like the ids do
export function directoryKeyFor(playerId: string): string {
  const bytes = hash128(playerId).flatMap((lane) => [
    lane >>> 24,
    (lane >>> 16) & 0xff,
    (lane >>> 8) & 0xff,
    lane & 0xff,
  ]);
  return toBase64Url(bytes.slice(0, KEY_BYTES));
}

export function playerDirectoryFrom(
  players: readonly MockPlayer[],
): PlayerDirectory {
  const entries = players.map((player) => ({
    key: directoryKeyFor(player.id),
    name: player.name,
    imageUrl: player.imageUrl,
    terms: [...new Set(player.aliases)].sort(),
  }));
  entries.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return { players: entries };
}

export const PLAYER_DIRECTORY: PlayerDirectory = playerDirectoryFrom(PLAYERS);
