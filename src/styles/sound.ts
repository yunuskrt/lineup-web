import { CRITICAL_SECONDS } from '@/lib/countdown';
import type {
  CueLayer,
  CueSpec,
  SoundCue,
  ToneLayer,
  ToneWave,
} from '@/types/sound';

export const MASTER_GAIN = 1;

// The opponent's clock ticks at half gain
export const OPPONENT_TICK_GAIN = 0.5;

export const NOTE_HZ = {
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
} as const;

function tone(
  wave: ToneWave,
  frequency: number,
  startMs: number,
  lengthMs: number,
  extra: Partial<ToneLayer> = {},
): ToneLayer {
  return { kind: 'tone', wave, frequency, startMs, lengthMs, ...extra };
}

function chime(low: number, high: number): CueLayer[] {
  return [tone('triangle', low, 0, 130), tone('triangle', high, 100, 150)];
}

function whistle(lengthMs: number): CueLayer[] {
  return [
    tone('sine', 2900, 0, lengthMs, { vibrato: { rateHz: 28, depthHz: 120 } }),
    {
      kind: 'noise',
      filter: 'bandpass',
      frequency: 3000,
      q: 2,
      startMs: 0,
      lengthMs,
      gain: 0.35,
    },
  ];
}

const WIN_ARPEGGIO: CueLayer[] = [
  tone('triangle', NOTE_HZ.C5, 0, 200),
  tone('triangle', NOTE_HZ.E5, 120, 200),
  tone('triangle', NOTE_HZ.G5, 240, 220),
  tone('triangle', NOTE_HZ.C6, 360, 340),
];

const LOSS_PHRASE: CueLayer[] = [
  tone('triangle', NOTE_HZ.C5, 0, 260),
  tone('triangle', NOTE_HZ.A4, 220, 260),
  tone('triangle', NOTE_HZ.F4, 440, 260),
];

// 5 → 1: one step higher each second
const FINAL_BEEP_HZ = [
  NOTE_HZ.A5,
  NOTE_HZ.B5,
  NOTE_HZ.C6,
  NOTE_HZ.D6,
  NOTE_HZ.E6,
];

export const FINAL_BEEP_FROM = FINAL_BEEP_HZ.length;

const FINAL_BEEP_GAIN = { calm: 0.3, critical: 0.45 } as const;

function beep(frequency: number, gain: number): CueSpec {
  return {
    layers: [
      tone('sine', frequency, 0, 80),
      tone('square', frequency, 0, 80, { gain: 0.15 }),
    ],
    attackMs: 3,
    gain,
  };
}

export const SOUND_CUES: Record<SoundCue, CueSpec> = {
  correctNew: {
    layers: chime(NOTE_HZ.E5, NOTE_HZ.B5),
    attackMs: 5,
    gain: 0.5,
  },
  theirReveal: {
    layers: chime(NOTE_HZ.E4, NOTE_HZ.B4),
    attackMs: 5,
    gain: 0.35,
  },
  notInXi: {
    layers: [tone('triangle', 220, 0, 150, { endFrequency: 140 })],
    attackMs: 4,
    gain: 0.35,
  },
  alreadyNamed: {
    layers: [tone('sine', 520, 0, 90)],
    attackMs: 4,
    gain: 0.25,
  },
  tick: {
    layers: [
      tone('sine', 1000, 0, 30),
      {
        kind: 'noise',
        filter: 'bandpass',
        frequency: 2500,
        q: 3,
        startMs: 0,
        lengthMs: 20,
        gain: 0.5,
      },
    ],
    attackMs: 1,
    gain: 0.15,
  },
  finalBeep: beep(FINAL_BEEP_HZ[0], FINAL_BEEP_GAIN.calm),
  lifeLost: { layers: whistle(450), attackMs: 15, gain: 0.4 },
  theirLifeLost: { layers: whistle(300), attackMs: 15, gain: 0.25 },
  turnToYou: {
    layers: [
      {
        kind: 'noise',
        filter: 'bandpass',
        frequency: 400,
        endFrequency: 1600,
        q: 1.5,
        startMs: 0,
        lengthMs: 240,
      },
    ],
    attackMs: 60,
    gain: 0.2,
  },
  opponentFound: {
    layers: [
      tone('triangle', NOTE_HZ.G5, 0, 130),
      tone('triangle', NOTE_HZ.D6, 120, 180),
    ],
    attackMs: 5,
    gain: 0.4,
  },
  resultWin: { layers: WIN_ARPEGGIO, attackMs: 8, gain: 0.45 },
  resultDraw: {
    layers: [
      tone('triangle', NOTE_HZ.G4, 0, 600),
      tone('triangle', NOTE_HZ.D5, 0, 600),
    ],
    attackMs: 20,
    gain: 0.4,
  },
  resultLoss: { layers: LOSS_PHRASE, attackMs: 8, gain: 0.35 },
  perfectClear: {
    layers: [
      ...WIN_ARPEGGIO,
      tone('sine', NOTE_HZ.E6, 460, 440, {
        gain: 0.4,
        vibrato: { rateHz: 6, depthHz: 8 },
      }),
    ],
    attackMs: 8,
    gain: 0.45,
  },
  runOver: { layers: LOSS_PHRASE, attackMs: 8, gain: 0.35 },
};

// Null outside 5 → 1; louder from the red stage
export function finalBeepFor(seconds: number): CueSpec | null {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > FINAL_BEEP_FROM) {
    return null;
  }

  const gain =
    seconds <= CRITICAL_SECONDS
      ? FINAL_BEEP_GAIN.critical
      : FINAL_BEEP_GAIN.calm;
  return beep(FINAL_BEEP_HZ[FINAL_BEEP_FROM - seconds], gain);
}
