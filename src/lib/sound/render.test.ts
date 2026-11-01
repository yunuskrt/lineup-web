import { describe, expect, it } from 'vitest';
import { renderCue, type SoundContext } from '@/lib/sound/render';
import type { CueSpec } from '@/types/sound';

type ParamCall = [method: string, value: number, time: number];

class FakeParam {
  calls: ParamCall[] = [];
  setValueAtTime(value: number, time: number) {
    this.calls.push(['set', value, time]);
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.calls.push(['linear', value, time]);
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    this.calls.push(['exp', value, time]);
  }
}

class FakeNode {
  targets: unknown[] = [];
  connect(target: unknown) {
    this.targets.push(target);
    return target;
  }
}

class FakeSource extends FakeNode {
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  start(time: number) {
    this.startedAt = time;
  }
  stop(time: number) {
    this.stoppedAt = time;
  }
}

class FakeOscillator extends FakeSource {
  type = 'sine';
  frequency = new FakeParam();
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeFilter extends FakeNode {
  type = 'lowpass';
  frequency = new FakeParam();
  Q = new FakeParam();
}

class FakeBufferSource extends FakeSource {
  buffer: unknown = null;
}

function fakeContext() {
  const made = {
    oscillators: [] as FakeOscillator[],
    gains: [] as FakeGain[],
    filters: [] as FakeFilter[],
    sources: [] as FakeBufferSource[],
    buffers: 0,
  };
  const context = {
    sampleRate: 100,
    createOscillator: () => {
      const node = new FakeOscillator();
      made.oscillators.push(node);
      return node;
    },
    createGain: () => {
      const node = new FakeGain();
      made.gains.push(node);
      return node;
    },
    createBiquadFilter: () => {
      const node = new FakeFilter();
      made.filters.push(node);
      return node;
    },
    createBufferSource: () => {
      const node = new FakeBufferSource();
      made.sources.push(node);
      return node;
    },
    createBuffer: (_: number, length: number) => {
      made.buffers += 1;
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    },
  };
  return { context: context as unknown as SoundContext, made };
}

const DESTINATION = {} as AudioNode;

const TONE: CueSpec = {
  layers: [
    {
      kind: 'tone',
      wave: 'triangle',
      frequency: 220,
      endFrequency: 140,
      startMs: 100,
      lengthMs: 200,
      gain: 0.5,
    },
  ],
  attackMs: 10,
  gain: 0.4,
};

const NOISE: CueSpec = {
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
};

describe('renderCue', () => {
  it('schedules a tone from the start time, with its glide', () => {
    const { context, made } = fakeContext();
    renderCue(context, DESTINATION, TONE, 2);

    const [oscillator] = made.oscillators;
    expect(oscillator.type).toBe('triangle');
    expect(oscillator.startedAt).toBeCloseTo(2.1);
    expect(oscillator.stoppedAt).toBeGreaterThan(2.3);
    expect(oscillator.frequency.calls).toEqual([
      ['set', 220, 2.1],
      ['exp', 140, expect.closeTo(2.3)],
    ]);
  });

  it('shapes the envelope: attack to the peak, then decay', () => {
    const { context, made } = fakeContext();
    renderCue(context, DESTINATION, TONE, 2);

    const [envelope] = made.gains;
    const [set, attack, decay] = envelope.gain.calls;
    expect(set[0]).toBe('set');
    expect(attack).toEqual([
      'linear',
      expect.closeTo(0.2),
      expect.closeTo(2.11),
    ]);
    expect(decay).toEqual(['exp', expect.closeTo(0.0001), expect.closeTo(2.3)]);
    expect(envelope.targets).toEqual([DESTINATION]);
    expect(made.oscillators[0].targets).toEqual([envelope]);
  });

  it('scales the peak for the opponent', () => {
    const { context, made } = fakeContext();
    renderCue(context, DESTINATION, TONE, 0, 0.5);
    expect(made.gains[0].gain.calls[1][1]).toBeCloseTo(0.1);
  });

  it('caps the attack at half a short layer', () => {
    const { context, made } = fakeContext();
    renderCue(context, DESTINATION, { ...TONE, attackMs: 500 }, 0);
    expect(made.gains[0].gain.calls[1][2]).toBeCloseTo(0.2);
  });

  it('skips a layer scaled to silence', () => {
    const { context, made } = fakeContext();
    renderCue(context, DESTINATION, TONE, 0, 0);
    expect(made.oscillators).toHaveLength(0);
    expect(made.gains).toHaveLength(0);
  });

  it('wires vibrato into the tone frequency', () => {
    const { context, made } = fakeContext();
    const spec: CueSpec = {
      ...TONE,
      layers: [
        {
          kind: 'tone',
          wave: 'sine',
          frequency: 2900,
          startMs: 0,
          lengthMs: 450,
          vibrato: { rateHz: 28, depthHz: 120 },
        },
      ],
    };
    renderCue(context, DESTINATION, spec, 0);

    const [tone, lfo] = made.oscillators;
    const depth = made.gains[1];
    expect(lfo.targets).toEqual([depth]);
    expect(depth.targets).toEqual([tone.frequency]);
    expect(depth.gain.calls[0]).toEqual(['set', 120, 0]);
    expect(lfo.stoppedAt).toBe(tone.stoppedAt);
  });

  it('runs noise through a swept filter', () => {
    const { context, made } = fakeContext();
    renderCue(context, DESTINATION, NOISE, 1);

    const [source] = made.sources;
    const [filter] = made.filters;
    expect(filter.type).toBe('bandpass');
    expect(source.targets).toEqual([filter]);
    expect(filter.targets).toEqual([made.gains[0]]);
    expect(filter.frequency.calls).toEqual([
      ['set', 400, 1],
      ['exp', 1600, expect.closeTo(1.24)],
    ]);
    expect(filter.Q.calls).toEqual([['set', 1.5, 1]]);
    expect(source.startedAt).toBe(1);
  });

  it('builds the noise buffer once per context', () => {
    const { context, made } = fakeContext();
    renderCue(context, DESTINATION, NOISE, 0);
    renderCue(context, DESTINATION, NOISE, 1);
    expect(made.buffers).toBe(1);
    expect(made.sources[0].buffer).toBe(made.sources[1].buffer);
  });
});
