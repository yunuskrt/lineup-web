import { describe, expect, it } from 'vitest';
import {
  hasLookAlike,
  isRoomCode,
  joinCodeFrom,
  roomClosesLabel,
  roomCodeInput,
  roomIntentFrom,
  roomLink,
  withRoom,
} from '@/lib/room-code';

describe('roomCodeInput', () => {
  it('uppercases and drops spaces and punctuation', () => {
    expect(roomCodeInput('k7 qm-2x')).toBe('K7QM2X');
  });

  it('keeps at most 6 characters', () => {
    expect(roomCodeInput('K7QM2XYZ')).toBe('K7QM2X');
  });

  it('keeps look-alikes visible, so the hint can name them', () => {
    expect(roomCodeInput('k7qm2o')).toBe('K7QM2O');
    expect(hasLookAlike('K7QM2O')).toBe(true);
    expect(hasLookAlike('K7QM2X')).toBe(false);
  });
});

describe('isRoomCode', () => {
  it('takes 6 characters of the alphabet', () => {
    expect(isRoomCode('K7QM2X')).toBe(true);
  });

  it('refuses short, long, lowercase and look-alike codes', () => {
    expect(isRoomCode('K7QM2')).toBe(false);
    expect(isRoomCode('K7QM2XY')).toBe(false);
    expect(isRoomCode('k7qm2x')).toBe(false);
    for (const lookAlike of ['0', 'O', '1', 'I', 'L']) {
      expect(isRoomCode(`K7QM2${lookAlike}`)).toBe(false);
    }
  });
});

describe('roomIntentFrom', () => {
  it('reads create, a code, or nothing', () => {
    expect(roomIntentFrom(new URLSearchParams('room=create'))).toEqual({
      kind: 'create',
    });
    expect(roomIntentFrom(new URLSearchParams('room=k7qm2x'))).toEqual({
      kind: 'join',
      code: 'K7QM2X',
    });
    expect(roomIntentFrom(new URLSearchParams('mode=duel'))).toBeNull();
  });
});

describe('joinCodeFrom', () => {
  it('prefills a code, never create', () => {
    expect(joinCodeFrom(new URLSearchParams('room=K7QM2X'))).toBe('K7QM2X');
    expect(joinCodeFrom(new URLSearchParams('room=create'))).toBe('');
    expect(joinCodeFrom(new URLSearchParams())).toBe('');
  });
});

describe('withRoom', () => {
  it('sets the room and keeps the rest', () => {
    const params = new URLSearchParams('mode=duel&comp=a');
    const next = withRoom(params, 'create');
    expect(next.toString()).toBe('mode=duel&comp=a&room=create');
    expect(params.has('room')).toBe(false);
  });
});

describe('roomLink', () => {
  it('opens the duel route on the code', () => {
    expect(roomLink('https://app.lineup.gg', 'K7QM2X')).toBe(
      'https://app.lineup.gg/play/duel?room=K7QM2X',
    );
  });
});

describe('roomClosesLabel', () => {
  it('counts minutes and seconds, rounding up', () => {
    expect(roomClosesLabel(10 * 60_000)).toBe('Closes in 10:00');
    expect(roomClosesLabel(581_200)).toBe('Closes in 9:42');
    expect(roomClosesLabel(5_000)).toBe('Closes in 0:05');
  });

  it('stops at zero', () => {
    expect(roomClosesLabel(-3_000)).toBe('Closes in 0:00');
  });
});
