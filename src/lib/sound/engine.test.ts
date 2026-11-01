import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SOUND_CUES } from '@/styles/sound';

type Engine = typeof import('@/lib/sound/engine');

class FakeParam {
  value = 0;
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeNode {
  connect() {}
}

class FakeOscillator extends FakeNode {
  type = 'sine';
  frequency = new FakeParam();
  start() {}
  stop() {}
}

class FakeContext {
  static made: FakeContext[] = [];
  static failRender = false;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  sampleRate = 100;
  destination = new FakeNode();
  oscillators = 0;
  resume = vi.fn(async () => {
    this.state = 'running';
  });

  constructor() {
    FakeContext.made.push(this);
  }

  createGain() {
    return Object.assign(new FakeNode(), { gain: new FakeParam() });
  }

  createOscillator() {
    if (FakeContext.failRender) throw new Error('InvalidStateError');
    this.oscillators += 1;
    return new FakeOscillator();
  }
}

function fakeWindow() {
  return { AudioContext: FakeContext, addEventListener: vi.fn() };
}

// Fresh module state per test: the engine is a singleton
async function loadEngine(): Promise<Engine> {
  vi.resetModules();
  return import('@/lib/sound/engine');
}

describe('engine without Web Audio', () => {
  it('turns every call into a no-op', async () => {
    const { listenForUnlock, playCue, unlockSound } = await loadEngine();
    expect(() => listenForUnlock()).not.toThrow();
    expect(() => unlockSound()).not.toThrow();
    expect(() => playCue(SOUND_CUES.correctNew)).not.toThrow();
    expect(() => playCue(SOUND_CUES.tick, 0.5)).not.toThrow();
  });
});

describe('engine with Web Audio', () => {
  let window: ReturnType<typeof fakeWindow>;

  beforeEach(() => {
    FakeContext.made = [];
    FakeContext.failRender = false;
    window = fakeWindow();
    vi.stubGlobal('window', window);
    vi.stubGlobal('AudioContext', FakeContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates no context until the first gesture', async () => {
    const { playCue } = await loadEngine();
    playCue(SOUND_CUES.correctNew);
    expect(FakeContext.made).toHaveLength(0);
  });

  it('creates one context on unlock and resumes it', async () => {
    const { unlockSound } = await loadEngine();
    unlockSound();
    unlockSound();
    expect(FakeContext.made).toHaveLength(1);
    expect(FakeContext.made[0].resume).toHaveBeenCalledOnce();
  });

  it('plays nothing while the context is still suspended', async () => {
    const { playCue, unlockSound } = await loadEngine();
    unlockSound();
    const [context] = FakeContext.made;
    context.state = 'suspended';
    playCue(SOUND_CUES.correctNew);
    expect(context.oscillators).toBe(0);
  });

  it('plays once the context runs', async () => {
    const { playCue, unlockSound } = await loadEngine();
    unlockSound();
    await Promise.resolve();
    playCue(SOUND_CUES.correctNew);
    expect(FakeContext.made[0].oscillators).toBe(2);
  });

  // Safari can suspend a running context again
  it('resumes again after a later suspend', async () => {
    const { unlockSound } = await loadEngine();
    unlockSound();
    await Promise.resolve();
    const [context] = FakeContext.made;
    context.state = 'suspended';
    unlockSound();
    expect(context.resume).toHaveBeenCalledTimes(2);
  });

  it('never resumes a closed context', async () => {
    const { unlockSound } = await loadEngine();
    unlockSound();
    const [context] = FakeContext.made;
    context.state = 'closed';
    unlockSound();
    expect(context.resume).toHaveBeenCalledOnce();
  });

  it('swallows a render error', async () => {
    const { playCue, unlockSound } = await loadEngine();
    unlockSound();
    await Promise.resolve();
    FakeContext.failRender = true;
    expect(() => playCue(SOUND_CUES.correctNew)).not.toThrow();
  });

  it('gives up for good when the constructor throws', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('NotSupportedError');
        }
      },
    );
    const { unlockSound } = await loadEngine();
    expect(() => unlockSound()).not.toThrow();
    expect(() => unlockSound()).not.toThrow();
  });

  it('listens for pointer and key gestures once', async () => {
    const { listenForUnlock, unlockSound } = await loadEngine();
    listenForUnlock();
    listenForUnlock();
    const events = window.addEventListener.mock.calls.map(([event]) => event);
    expect(events).toEqual(['pointerdown', 'keydown']);
    expect(window.addEventListener.mock.calls[0][1]).toBe(unlockSound);
  });
});
