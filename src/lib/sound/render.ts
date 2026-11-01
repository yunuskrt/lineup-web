import type { CueLayer, CueSpec, NoiseLayer, ToneLayer } from '@/types/sound';

export type SoundContext = Pick<
  BaseAudioContext,
  | 'sampleRate'
  | 'createBuffer'
  | 'createBufferSource'
  | 'createBiquadFilter'
  | 'createGain'
  | 'createOscillator'
>;

// Exponential ramps can't reach 0
const SILENT = 0.0001;
// Past the envelope, so nothing clicks off
const STOP_PAD_S = 0.02;
const NOISE_SECONDS = 1;

const noiseBuffers = new WeakMap<SoundContext, AudioBuffer>();

function noiseBuffer(context: SoundContext): AudioBuffer {
  const cached = noiseBuffers.get(context);
  if (cached) return cached;

  const length = Math.floor(context.sampleRate * NOISE_SECONDS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) samples[i] = Math.random() * 2 - 1;
  noiseBuffers.set(context, buffer);
  return buffer;
}

type Span = { start: number; end: number };

function layerSpan(layer: CueLayer, startAt: number): Span {
  const start = startAt + layer.startMs / 1000;
  return { start, end: start + layer.lengthMs / 1000 };
}

function envelope(
  context: SoundContext,
  peak: number,
  attackMs: number,
  { start, end }: Span,
): GainNode {
  const node = context.createGain();
  const attackEnd = Math.min(start + attackMs / 1000, (start + end) / 2);
  node.gain.setValueAtTime(SILENT, start);
  node.gain.linearRampToValueAtTime(peak, attackEnd);
  node.gain.exponentialRampToValueAtTime(SILENT, end);
  return node;
}

function glide(
  param: AudioParam,
  layer: ToneLayer | NoiseLayer,
  { start, end }: Span,
) {
  param.setValueAtTime(layer.frequency, start);
  if (layer.endFrequency !== undefined) {
    param.exponentialRampToValueAtTime(layer.endFrequency, end);
  }
}

function playTone(
  context: SoundContext,
  layer: ToneLayer,
  span: Span,
  output: AudioNode,
) {
  const oscillator = context.createOscillator();
  oscillator.type = layer.wave;
  glide(oscillator.frequency, layer, span);
  oscillator.connect(output);
  oscillator.start(span.start);
  oscillator.stop(span.end + STOP_PAD_S);

  if (!layer.vibrato) return;
  const lfo = context.createOscillator();
  const depth = context.createGain();
  lfo.frequency.setValueAtTime(layer.vibrato.rateHz, span.start);
  depth.gain.setValueAtTime(layer.vibrato.depthHz, span.start);
  lfo.connect(depth);
  depth.connect(oscillator.frequency);
  lfo.start(span.start);
  lfo.stop(span.end + STOP_PAD_S);
}

function playNoise(
  context: SoundContext,
  layer: NoiseLayer,
  span: Span,
  output: AudioNode,
) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  source.buffer = noiseBuffer(context);
  filter.type = layer.filter;
  filter.Q.setValueAtTime(layer.q, span.start);
  glide(filter.frequency, layer, span);
  source.connect(filter);
  filter.connect(output);
  source.start(span.start);
  source.stop(span.end + STOP_PAD_S);
}

export function renderCue(
  context: SoundContext,
  destination: AudioNode,
  spec: CueSpec,
  startAt: number,
  gainScale = 1,
): void {
  for (const layer of spec.layers) {
    const span = layerSpan(layer, startAt);
    const peak = spec.gain * (layer.gain ?? 1) * gainScale;
    if (peak <= SILENT) continue;
    const output = envelope(context, peak, spec.attackMs, span);
    output.connect(destination);

    if (layer.kind === 'tone') playTone(context, layer, span, output);
    else playNoise(context, layer, span, output);
  }
}
