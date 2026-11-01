import { describe, expect, it } from 'vitest';
import {
  SAMPLE_IDENTITY,
  SAMPLE_MATCH,
  SAMPLE_OPPONENT,
  SAMPLE_YOU,
  samplePlayer,
} from '@/lib/dev/samples';
import {
  LATE_CUE_DELAY_MS,
  clockCueFor,
  heardClockCue,
  scheduleCues,
  soundCuesFor,
} from '@/lib/sound-cues';
import { OPPONENT_TICK_GAIN, SOUND_CUES, finalBeepFor } from '@/styles/sound';
import type {
  CanvasViewBase,
  DuelCanvasView,
  SoloCanvasView,
} from '@/types/canvas';
import type { DuelActor, DuelResult } from '@/types/duel';
import type { SoloEndReason } from '@/types/game';
import type { FoundPlayer } from '@/types/player';
import type { SoloSummary } from '@/types/solo';

const PLAYERS = Array.from({ length: 11 }, (_, slot) =>
  samplePlayer(SAMPLE_MATCH.formation, slot),
);

function found(count: number): FoundPlayer[] {
  return PLAYERS.slice(0, count);
}

function foundBy(count: number, actor: DuelActor) {
  return PLAYERS.slice(0, count).map((player) => ({
    ...player,
    foundBy: actor,
  }));
}

const BASE: CanvasViewBase = {
  match: SAMPLE_MATCH,
  found: [],
  clock: { round: null, isFrozen: false },
  input: 'live',
  toast: null,
  shakeKey: 0,
  lifeLostKey: 0,
  gate: null,
};

function solo(overrides: Partial<SoloCanvasView> = {}): SoloCanvasView {
  return { ...BASE, mode: 'solo', lives: 3, end: null, ...overrides };
}

function duel(overrides: Partial<DuelCanvasView> = {}): DuelCanvasView {
  return {
    ...BASE,
    mode: 'duel',
    you: SAMPLE_YOU,
    opponent: SAMPLE_OPPONENT,
    turn: 'you',
    lobby: null,
    opponentConnection: null,
    yourConnection: null,
    end: null,
    ...overrides,
  };
}

function result(outcome: DuelResult['outcome']): DuelResult {
  return {
    outcome,
    match: SAMPLE_IDENTITY,
    found: foundBy(4, 'you'),
    you: SAMPLE_YOU,
    opponent: SAMPLE_OPPONENT,
    isForfeit: outcome === 'forfeit_win',
  };
}

function summary(endReason: SoloEndReason): SoloSummary {
  return {
    match: SAMPLE_IDENTITY,
    found: found(4),
    missedCount: 7,
    missed: null,
    livesRemaining: 0,
    endReason,
    accuracy: 0.5,
    bestStreak: 2,
    roundTimesMs: [3_000],
  };
}

function ended(endReason: SoloEndReason): SoloCanvasView {
  return solo({ end: { status: 'ready', summary: summary(endReason) } });
}

describe('soundCuesFor: reveals', () => {
  it('chimes for your new player in solo', () => {
    expect(
      soundCuesFor(solo({ found: found(2) }), solo({ found: found(3) })),
    ).toEqual(['correctNew']);
  });

  it('chimes for your new player in a duel', () => {
    const prev = duel({ found: foundBy(2, 'you') });
    const next = duel({ found: foundBy(3, 'you') });
    expect(soundCuesFor(prev, next)).toEqual(['correctNew']);
  });

  it('chimes lower for theirs', () => {
    const prev = duel({ found: foundBy(2, 'you') });
    const next = duel({
      found: [...foundBy(2, 'you'), { ...PLAYERS[2], foundBy: 'opponent' }],
    });
    expect(soundCuesFor(prev, next)).toEqual(['theirReveal']);
  });

  // A resume snapshot, not a reveal
  it('stays silent when several arrive at once', () => {
    expect(soundCuesFor(solo(), solo({ found: found(5) }))).toEqual([]);
  });

  // W31a: a reload with one player named
  it('stays silent when one arrives with the match', () => {
    const prev = duel({ match: null, turn: null });
    expect(soundCuesFor(prev, duel({ found: foundBy(1, 'you') }))).toEqual([]);
  });

  it('stays silent when nothing new arrives', () => {
    expect(
      soundCuesFor(solo({ found: found(3) }), solo({ found: found(3) })),
    ).toEqual([]);
  });
});

describe('soundCuesFor: verdicts and lives', () => {
  it('thunks when the input shakes', () => {
    expect(soundCuesFor(solo(), solo({ shakeKey: 1 }))).toEqual(['notInXi']);
  });

  it('blips when the grid pulses', () => {
    const pulse = { playerId: PLAYERS[0].id, key: 1 };
    expect(soundCuesFor(solo(), solo({ pulse }))).toEqual(['alreadyNamed']);
  });

  it('blips again for a second pulse', () => {
    const prev = solo({ pulse: { playerId: PLAYERS[0].id, key: 1 } });
    const next = solo({ pulse: { playerId: PLAYERS[0].id, key: 2 } });
    expect(soundCuesFor(prev, next)).toEqual(['alreadyNamed']);
  });

  it('never repeats a pulse it already heard', () => {
    const pulse = { playerId: PLAYERS[0].id, key: 1 };
    expect(soundCuesFor(solo({ pulse }), solo({ pulse }))).toEqual([]);
  });

  it('whistles when your life is lost', () => {
    expect(soundCuesFor(solo(), solo({ lifeLostKey: 1 }))).toEqual([
      'lifeLost',
    ]);
  });

  it('whistles quieter when theirs is lost', () => {
    const next = duel({ opponent: { ...SAMPLE_OPPONENT, lives: 2 } });
    expect(soundCuesFor(duel(), next)).toEqual(['theirLifeLost']);
  });

  it('ignores your own lives falling in the duel players', () => {
    const next = duel({ you: { ...SAMPLE_YOU, lives: 2 } });
    expect(soundCuesFor(duel(), next)).toEqual([]);
  });

  it('ignores an opponent appearing', () => {
    expect(soundCuesFor(duel({ opponent: null }), duel())).toEqual([]);
  });
});

describe('soundCuesFor: duel flow', () => {
  it('chimes when matchmaking pairs you', () => {
    const prev = duel({ lobby: { step: 'searching' }, turn: null });
    const next = duel({
      lobby: { step: 'paired', opponent: SAMPLE_OPPONENT },
      turn: null,
    });
    expect(soundCuesFor(prev, next)).toEqual(['opponentFound']);
  });

  // W31a: a reload goes searching → match
  it('stays silent when a resume skips the pairing', () => {
    const prev = duel({ lobby: { step: 'searching' }, turn: null });
    expect(soundCuesFor(prev, duel())).toEqual([]);
  });

  it('whooshes when the turn passes to you', () => {
    expect(soundCuesFor(duel({ turn: 'opponent' }), duel())).toEqual([
      'turnToYou',
    ]);
  });

  it('stays silent on the first turn and on yours ending', () => {
    expect(soundCuesFor(duel({ turn: null }), duel())).toEqual([]);
    expect(soundCuesFor(duel(), duel({ turn: 'opponent' }))).toEqual([]);
  });

  it.each([
    ['win', 'resultWin'],
    ['forfeit_win', 'resultWin'],
    ['draw', 'resultDraw'],
    ['loss', 'resultLoss'],
  ] as const)('stings a %s once', (outcome, cue) => {
    const next = duel({ end: result(outcome), turn: null });
    expect(soundCuesFor(duel({ turn: null }), next)).toEqual([cue]);
    expect(soundCuesFor(next, next)).toEqual([]);
  });

  it('stings a lost connection as a loss', () => {
    const next = duel({
      end: result('win'),
      endReason: 'connectionLost',
      turn: null,
    });
    expect(soundCuesFor(duel({ turn: null }), next)).toEqual(['resultLoss']);
  });

  // W31b: the player wasn't there
  it('stays silent on the ended-away gate', () => {
    const next = duel({
      turn: null,
      gate: { title: 'The duel ended while you were away' },
    });
    expect(soundCuesFor(duel({ turn: 'opponent' }), next)).toEqual([]);
  });

  it('plays the 11th name before the draw', () => {
    const prev = duel({ found: foundBy(10, 'you'), turn: 'opponent' });
    const next = duel({
      found: [...foundBy(10, 'you'), { ...PLAYERS[10], foundBy: 'opponent' }],
      end: { ...result('draw'), found: foundBy(11, 'you') },
      turn: null,
    });
    expect(soundCuesFor(prev, next)).toEqual(['theirReveal', 'resultDraw']);
  });
});

describe('soundCuesFor: solo endings', () => {
  it('stings a perfect clear', () => {
    const prev = solo({ end: { status: 'loading' } });
    expect(soundCuesFor(prev, ended('perfect_clear'))).toEqual([
      'perfectClear',
    ]);
  });

  it('stings a run over', () => {
    expect(soundCuesFor(solo(), ended('lives_out'))).toEqual(['runOver']);
  });

  it('stays silent on a quit', () => {
    expect(soundCuesFor(solo(), ended('quit'))).toEqual([]);
  });

  it('stings once', () => {
    const done = ended('lives_out');
    expect(soundCuesFor(done, done)).toEqual([]);
  });
});

describe('soundCuesFor: switches', () => {
  it('stays silent when the match changes', () => {
    const prev = solo({ found: found(2) });
    const next = solo({
      match: { ...SAMPLE_MATCH, id: 'another-match' },
      found: found(3),
      lifeLostKey: 1,
      shakeKey: 1,
    });
    expect(soundCuesFor(prev, next)).toEqual([]);
  });

  it('stays silent across modes', () => {
    expect(soundCuesFor(solo(), duel({ shakeKey: 1 }))).toEqual([]);
  });
});

describe('scheduleCues', () => {
  it('plays event cues at once', () => {
    expect(scheduleCues(['correctNew', 'lifeLost'])).toEqual([
      { cue: 'correctNew', delayMs: 0 },
      { cue: 'lifeLost', delayMs: 0 },
    ]);
  });

  it('holds a late cue behind an event cue', () => {
    expect(scheduleCues(['theirLifeLost', 'resultWin'])).toEqual([
      { cue: 'theirLifeLost', delayMs: 0 },
      { cue: 'resultWin', delayMs: LATE_CUE_DELAY_MS },
    ]);
    expect(LATE_CUE_DELAY_MS).toBe(300);
  });

  it('plays a late cue alone at once', () => {
    expect(scheduleCues(['turnToYou'])).toEqual([
      { cue: 'turnToYou', delayMs: 0 },
    ]);
  });

  // The summary lands milliseconds after the 11th
  it('holds a late cue for what is left of the gap', () => {
    expect(scheduleCues(['perfectClear'], 6)).toEqual([
      { cue: 'perfectClear', delayMs: LATE_CUE_DELAY_MS - 6 },
    ]);
  });

  it('plays a late cue at once once the gap has passed', () => {
    expect(scheduleCues(['runOver'], LATE_CUE_DELAY_MS)).toEqual([
      { cue: 'runOver', delayMs: 0 },
    ]);
    expect(scheduleCues(['runOver'], 5_000)).toEqual([
      { cue: 'runOver', delayMs: 0 },
    ]);
  });

  it('never delays an event cue', () => {
    expect(scheduleCues(['correctNew'], 0)).toEqual([
      { cue: 'correctNew', delayMs: 0 },
    ]);
  });
});

describe('heardClockCue', () => {
  const ROUND = { startedAt: 1_000, endsAt: 16_000 };
  const at = (seconds: number, round = ROUND) => ({ ...round, seconds });

  it('plays when the shown second moves on', () => {
    expect(heardClockCue(at(10), at(9), 'you')).toEqual({
      cue: SOUND_CUES.tick,
    });
  });

  it('stays silent within the same second', () => {
    expect(heardClockCue(at(9), at(9), 'you')).toBeNull();
  });

  it('only listens on the first frame after mount', () => {
    expect(heardClockCue(null, at(9), 'you')).toBeNull();
  });

  it('only listens on a new round', () => {
    const next = { startedAt: 17_000, endsAt: 32_000 };
    expect(heardClockCue(at(1), at(14, next), 'you')).toBeNull();
  });

  it('only listens when the start moves', () => {
    const reissued = { ...ROUND, startedAt: 2_000 };
    expect(heardClockCue(at(9), at(8, reissued), 'you')).toBeNull();
  });

  it('only listens when the deadline moves', () => {
    const moved = { ...ROUND, endsAt: 17_000 };
    expect(heardClockCue(at(9), at(8, moved), 'you')).toBeNull();
  });

  // A throttled tab: no burst of missed ticks
  it('plays only the current second after a skip', () => {
    expect(heardClockCue(at(9), at(4), 'you')).toEqual({
      cue: finalBeepFor(4),
    });
  });

  it('plays the opponent tick at half gain', () => {
    expect(heardClockCue(at(4), at(3), 'opponent')).toEqual({
      cue: SOUND_CUES.tick,
      gainScale: OPPONENT_TICK_GAIN,
    });
  });
});

describe('clockCueFor', () => {
  it.each([15, 0, -1, 2.5])('is silent at %s', (seconds) => {
    expect(clockCueFor(seconds, 'you')).toBeNull();
    expect(clockCueFor(seconds, 'opponent')).toBeNull();
  });

  it.each([14, 9, 6])('ticks at %s on your turn', (seconds) => {
    expect(clockCueFor(seconds, 'you')).toEqual({ cue: SOUND_CUES.tick });
  });

  it.each([5, 3, 1])('beeps for %s on your turn', (seconds) => {
    expect(clockCueFor(seconds, 'you')).toEqual({
      cue: finalBeepFor(seconds),
    });
  });

  // Urgency belongs to your own clock
  it.each([14, 6, 5, 3, 1])('ticks at half gain at %s on theirs', (seconds) => {
    expect(clockCueFor(seconds, 'opponent')).toEqual({
      cue: SOUND_CUES.tick,
      gainScale: OPPONENT_TICK_GAIN,
    });
  });
});
