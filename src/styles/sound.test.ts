import { describe, expect, it } from 'vitest';
import { CRITICAL_SECONDS } from '@/lib/countdown';
import {
  FINAL_BEEP_FROM,
  NOTE_HZ,
  OPPONENT_TICK_GAIN,
  SOUND_CUES,
  finalBeepFor,
} from '@/styles/sound';
import type { CueSpec } from '@/types/sound';

// From theme.md § Sound, with a little slack
const CUE_LENGTH_MS: Record<keyof typeof SOUND_CUES, number> = {
  correctNew: 250,
  theirReveal: 250,
  notInXi: 150,
  alreadyNamed: 90,
  tick: 30,
  finalBeep: 80,
  lifeLost: 450,
  theirLifeLost: 300,
  turnToYou: 240,
  opponentFound: 300,
  resultWin: 700,
  resultDraw: 600,
  resultLoss: 700,
  perfectClear: 900,
  runOver: 700,
};

const CUE_GAIN: Record<keyof typeof SOUND_CUES, number> = {
  correctNew: 0.5,
  theirReveal: 0.35,
  notInXi: 0.35,
  alreadyNamed: 0.25,
  tick: 0.15,
  finalBeep: 0.3,
  lifeLost: 0.4,
  theirLifeLost: 0.25,
  turnToYou: 0.2,
  opponentFound: 0.4,
  resultWin: 0.45,
  resultDraw: 0.4,
  resultLoss: 0.35,
  perfectClear: 0.45,
  runOver: 0.35,
};

function lengthOf(spec: CueSpec): number {
  return Math.max(...spec.layers.map((l) => l.startMs + l.lengthMs));
}

function pitchOf(spec: CueSpec): number {
  return spec.layers[0].kind === 'tone' ? spec.layers[0].frequency : 0;
}

describe('SOUND_CUES', () => {
  it.each(Object.entries(SOUND_CUES))('%s matches theme.md', (cue, spec) => {
    const name = cue as keyof typeof SOUND_CUES;
    expect(lengthOf(spec)).toBe(CUE_LENGTH_MS[name]);
    expect(spec.gain).toBe(CUE_GAIN[name]);
  });

  it.each(Object.entries(SOUND_CUES))(
    '%s stays below clipping and starts with its attack',
    (_, spec) => {
      expect(spec.layers.length).toBeGreaterThan(0);
      expect(spec.gain).toBeGreaterThan(0);
      expect(spec.gain).toBeLessThanOrEqual(0.5);
      for (const layer of spec.layers) {
        expect(layer.startMs).toBeGreaterThanOrEqual(0);
        expect(layer.lengthMs).toBeGreaterThan(spec.attackMs);
      }
    },
  );

  // The opponent's cues must sound like theirs
  it('puts their reveal an octave under yours', () => {
    expect(pitchOf(SOUND_CUES.theirReveal) * 2).toBeCloseTo(
      pitchOf(SOUND_CUES.correctNew),
      0,
    );
    expect(SOUND_CUES.theirReveal.gain).toBeLessThan(
      SOUND_CUES.correctNew.gain,
    );
  });

  it('halves the gain of their clock', () => {
    expect(OPPONENT_TICK_GAIN).toBe(0.5);
  });

  it('makes their lost life shorter and quieter', () => {
    expect(lengthOf(SOUND_CUES.theirLifeLost)).toBeLessThan(
      lengthOf(SOUND_CUES.lifeLost),
    );
    expect(SOUND_CUES.theirLifeLost.gain).toBeLessThan(
      SOUND_CUES.lifeLost.gain,
    );
  });

  it('keeps the two no-penalty verdicts apart', () => {
    expect(pitchOf(SOUND_CUES.alreadyNamed)).not.toBe(
      pitchOf(SOUND_CUES.notInXi),
    );
    expect(SOUND_CUES.notInXi.layers[0]).toMatchObject({ endFrequency: 140 });
  });
});

describe('finalBeepFor', () => {
  const beeps = [5, 4, 3, 2, 1].map((seconds) => finalBeepFor(seconds));

  it('beeps for each of the last five seconds', () => {
    expect(FINAL_BEEP_FROM).toBe(5);
    expect(beeps.every((beep) => beep !== null)).toBe(true);
  });

  it('steps up in pitch each second, A5 to E6', () => {
    const pitches = beeps.map((beep) => (beep ? pitchOf(beep) : 0));
    expect(pitches[0]).toBe(NOTE_HZ.A5);
    expect(pitches[4]).toBe(NOTE_HZ.E6);
    for (let i = 1; i < pitches.length; i += 1) {
      expect(pitches[i]).toBeGreaterThan(pitches[i - 1]);
    }
  });

  it('gets louder from the red stage', () => {
    expect(CRITICAL_SECONDS).toBe(3);
    expect(finalBeepFor(5)?.gain).toBe(0.3);
    expect(finalBeepFor(4)?.gain).toBe(0.3);
    expect(finalBeepFor(3)?.gain).toBe(0.45);
    expect(finalBeepFor(1)?.gain).toBe(0.45);
  });

  it('matches the table entry at 5 seconds', () => {
    expect(finalBeepFor(5)).toEqual(SOUND_CUES.finalBeep);
  });

  // 0 belongs to the server's life-lost event
  it.each([0, 6, 15, -1, 2.5])('is silent at %s', (seconds) => {
    expect(finalBeepFor(seconds)).toBeNull();
  });
});
