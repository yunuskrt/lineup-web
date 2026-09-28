import { describe, expect, it } from 'vitest';
import {
  reconnectSecondsLeft,
  turnAnnouncement,
  waitingLine,
} from '@/lib/duel-status';

describe('reconnectSecondsLeft', () => {
  const NOW = 1_000_000;

  it('rounds partial seconds up', () => {
    expect(reconnectSecondsLeft(NOW + 18_000, NOW)).toBe(18);
    expect(reconnectSecondsLeft(NOW + 17_001, NOW)).toBe(18);
    expect(reconnectSecondsLeft(NOW + 400, NOW)).toBe(1);
  });

  it('stops at zero past the deadline', () => {
    expect(reconnectSecondsLeft(NOW, NOW)).toBe(0);
    expect(reconnectSecondsLeft(NOW - 5_000, NOW)).toBe(0);
  });
});

describe('turnAnnouncement', () => {
  it('names the turn when nobody is reconnecting', () => {
    expect(turnAnnouncement('you', false)).toBe('Your turn.');
    expect(turnAnnouncement('opponent', false)).toBe('Their turn.');
    expect(turnAnnouncement(null, false)).toBe('');
  });

  it('keeps your turn first while they reconnect', () => {
    expect(turnAnnouncement('you', true)).toBe(
      'Your turn. Your opponent is reconnecting.',
    );
  });

  it('says their clock runs only on their turn', () => {
    expect(turnAnnouncement('opponent', true)).toBe(
      'Their turn. Your opponent is reconnecting. Their clock keeps running.',
    );
    expect(turnAnnouncement('you', true)).not.toContain('clock');
    expect(turnAnnouncement(null, true)).toBe('Your opponent is reconnecting.');
  });
});

describe('waitingLine', () => {
  it('waits on the opponent by handle', () => {
    expect(waitingLine('deadball_dan', false)).toBe('Waiting for deadball_dan');
    expect(waitingLine(null, false)).toBe('Waiting for your opponent');
  });

  it('says outright that their clock keeps running', () => {
    expect(waitingLine('deadball_dan', true)).toBe(
      'deadball_dan is reconnecting. Their clock keeps running.',
    );
    expect(waitingLine(null, true)).toBe(
      'Your opponent is reconnecting. Their clock keeps running.',
    );
  });
});
