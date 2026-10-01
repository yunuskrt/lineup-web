import { describe, expect, it } from 'vitest';
import {
  droppedLifeActor,
  reconnectSecondsLeft,
  shownLivesActor,
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

describe('droppedLifeActor', () => {
  it('names the player whose lives fell', () => {
    expect(
      droppedLifeActor({ you: 3, opponent: 3 }, { you: 2, opponent: 3 }),
    ).toBe('you');
    expect(
      droppedLifeActor({ you: 3, opponent: 2 }, { you: 3, opponent: 1 }),
    ).toBe('opponent');
  });

  it('names no one when lives hold or rise', () => {
    expect(
      droppedLifeActor({ you: 2, opponent: 2 }, { you: 2, opponent: 2 }),
    ).toBeNull();
    // A rematch resets lives upward
    expect(
      droppedLifeActor({ you: 0, opponent: 1 }, { you: 3, opponent: 3 }),
    ).toBeNull();
  });

  it('treats an opponent arriving or leaving as no drop', () => {
    expect(
      droppedLifeActor({ you: 3, opponent: null }, { you: 3, opponent: 3 }),
    ).toBeNull();
    expect(
      droppedLifeActor({ you: 3, opponent: 3 }, { you: 3, opponent: null }),
    ).toBeNull();
  });

  it('counts a fall to zero', () => {
    expect(
      droppedLifeActor({ you: 1, opponent: 3 }, { you: 0, opponent: 3 }),
    ).toBe('you');
  });
});

describe('shownLivesActor', () => {
  it('follows the turn by default', () => {
    expect(shownLivesActor(null, null, 'opponent')).toBe('opponent');
    expect(shownLivesActor(null, null, 'you')).toBe('you');
  });

  it('shows you before the first round', () => {
    expect(shownLivesActor(null, null, null)).toBe('you');
  });

  it('holds on the player who just lost a life', () => {
    expect(shownLivesActor(null, 'you', 'opponent')).toBe('you');
  });

  it('lets a peek win over the hold and the turn', () => {
    expect(shownLivesActor('opponent', 'you', 'you')).toBe('opponent');
    expect(shownLivesActor('you', null, 'opponent')).toBe('you');
  });
});
