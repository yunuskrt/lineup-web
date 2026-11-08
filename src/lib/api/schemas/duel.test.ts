import { describe, expect, it } from 'vitest';
import {
  coinFlipResultSchema,
  ROOM_CODE_ALPHABET,
  roomCodeSchema,
  roomExpirySchema,
  roomStateSchema,
} from '@/lib/api/schemas/duel';
import { historyEntrySchema } from '@/lib/api/schemas/profile';
import { SAMPLE_FILTERS, SAMPLE_IDENTITY } from '@/lib/dev/samples';

describe('roomCodeSchema', () => {
  it('has 31 characters, none of them look-alikes', () => {
    expect(ROOM_CODE_ALPHABET).toHaveLength(31);
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[01OIL]/);
  });

  it('takes 6 uppercase characters of the alphabet', () => {
    expect(roomCodeSchema.safeParse('K7QM2X').success).toBe(true);
    expect(roomCodeSchema.safeParse('k7qm2x').success).toBe(false);
    expect(roomCodeSchema.safeParse('K7QM2').success).toBe(false);
    expect(roomCodeSchema.safeParse('K7QM20').success).toBe(false);
  });
});

describe('room payloads', () => {
  it('parses a room state and an expiry', () => {
    const room = { code: 'K7QM2X', filters: SAMPLE_FILTERS, expiresAt: 1 };
    expect(roomStateSchema.parse(room)).toEqual(room);
    expect(roomExpirySchema.parse({ code: 'K7QM2X' })).toEqual({
      code: 'K7QM2X',
    });
  });

  it('refuses a room with a bad code or no deadline', () => {
    const room = { code: 'K7QM2X', filters: SAMPLE_FILTERS, expiresAt: 1 };
    expect(roomStateSchema.safeParse({ ...room, code: 'nope' }).success).toBe(
      false,
    );
    expect(
      roomStateSchema.safeParse({ ...room, expiresAt: undefined }).success,
    ).toBe(false);
  });
});

describe('coinFlipResultSchema', () => {
  const FLIP = { winner: 'you', filters: SAMPLE_FILTERS };

  // Until backend R6, the server sends no source
  it('reads a flip with no source as a coin', () => {
    expect(coinFlipResultSchema.parse(FLIP).source).toBe('coin');
  });

  it('keeps a room source and refuses an unknown one', () => {
    expect(coinFlipResultSchema.parse({ ...FLIP, source: 'room' }).source).toBe(
      'room',
    );
    expect(
      coinFlipResultSchema.safeParse({ ...FLIP, source: 'dice' }).success,
    ).toBe(false);
  });
});

describe('historyEntrySchema, duel', () => {
  const DUEL = {
    id: 'duel-1',
    playedAt: '2026-11-08T12:00:00.000Z',
    match: SAMPLE_IDENTITY,
    foundCount: 4,
    livesRemaining: 1,
    mode: 'duel',
    outcome: 'win',
  };

  it('reads a duel with no isPrivate as a queue duel', () => {
    const entry = historyEntrySchema.parse(DUEL);
    expect(entry.mode === 'duel' && entry.isPrivate).toBe(false);
  });

  it('keeps a room game marked private', () => {
    const entry = historyEntrySchema.parse({ ...DUEL, isPrivate: true });
    expect(entry.mode === 'duel' && entry.isPrivate).toBe(true);
  });
});
