import { ROOM_CODE_LENGTH, roomCodeSchema } from '@/lib/api/schemas/duel';
import type { RoomIntent } from '@/types/room';

export const ROOM_PARAM = 'room';
export const CREATE_ROOM = 'create';

const LOOK_ALIKES = /[01OIL]/;
const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;

export const ROOM_CODE_HINT = "Room codes don't use 0, O, 1, I or L.";

// Typing aid only: the server decides
export function roomCodeInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

export function isRoomCode(value: string): boolean {
  return roomCodeSchema.safeParse(value).success;
}

export function hasLookAlike(value: string): boolean {
  return LOOK_ALIKES.test(value);
}

// `?room=create` makes one; a code joins it
export function roomIntentFrom(params: URLSearchParams): RoomIntent | null {
  const value = params.get(ROOM_PARAM);
  if (!value) return null;
  if (value === CREATE_ROOM) return { kind: 'create' };
  return { kind: 'join', code: roomCodeInput(value) };
}

export function withRoom(
  params: URLSearchParams,
  value: string,
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.set(ROOM_PARAM, value);
  return next;
}

// A code to prefill on /play; never `create`
export function joinCodeFrom(params: URLSearchParams): string {
  const intent = roomIntentFrom(params);
  return intent?.kind === 'join' ? intent.code : '';
}

export function roomLink(origin: string, code: string): string {
  return `${origin}/play/duel?${ROOM_PARAM}=${code}`;
}

// Presentation only: the server expires the room
export function roomClosesLabel(remainingMs: number): string {
  const total = Math.max(0, Math.ceil(remainingMs / MS_PER_SECOND));
  const minutes = Math.floor(total / SECONDS_PER_MINUTE);
  const seconds = total % SECONDS_PER_MINUTE;
  return `Closes in ${minutes}:${String(seconds).padStart(2, '0')}`;
}
