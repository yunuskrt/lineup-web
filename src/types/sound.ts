export type SoundCue =
  | 'correctNew'
  | 'theirReveal'
  | 'notInXi'
  | 'alreadyNamed'
  | 'tick'
  | 'finalBeep'
  | 'lifeLost'
  | 'theirLifeLost'
  | 'turnToYou'
  | 'opponentFound'
  | 'resultWin'
  | 'resultDraw'
  | 'resultLoss'
  | 'perfectClear'
  | 'runOver';

export type ToneWave = 'sine' | 'triangle' | 'square';

export type Vibrato = { rateHz: number; depthHz: number };

type LayerTiming = {
  startMs: number;
  lengthMs: number;
  // Scales the cue's gain for this layer
  gain?: number;
};

export type ToneLayer = LayerTiming & {
  kind: 'tone';
  wave: ToneWave;
  frequency: number;
  // Glides to this by the layer's end
  endFrequency?: number;
  vibrato?: Vibrato;
};

export type NoiseLayer = LayerTiming & {
  kind: 'noise';
  filter: 'bandpass' | 'highpass';
  frequency: number;
  endFrequency?: number;
  q: number;
};

export type CueLayer = ToneLayer | NoiseLayer;

export type CueSpec = {
  layers: CueLayer[];
  attackMs: number;
  gain: number;
};

export type PlayOptions = {
  // The opponent's quieter cues
  gainScale?: number;
};

export type ClockCue = { cue: CueSpec; gainScale?: number };

export type ScheduledCue = { cue: SoundCue; delayMs: number };

// The second a round's ring last showed
export type HeardSecond = {
  startedAt: number;
  endsAt: number;
  seconds: number;
};
