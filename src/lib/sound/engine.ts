import { renderCue } from '@/lib/sound/render';
import { MASTER_GAIN } from '@/styles/sound';
import type { CueSpec } from '@/types/sound';

type Engine = { context: AudioContext; master: GainNode };

let engine: Engine | null = null;
let isUnavailable = false;
let isListening = false;

function createEngine(): Engine | null {
  if (isUnavailable) return null;
  if (typeof window === 'undefined' || !('AudioContext' in window)) {
    isUnavailable = true;
    return null;
  }

  try {
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(context.destination);
    return { context, master };
  } catch {
    isUnavailable = true;
    return null;
  }
}

// Only inside a gesture, so the console stays clean
export function unlockSound(): void {
  engine ??= createEngine();
  const state = engine?.context.state;
  if (!engine || state === 'running' || state === 'closed') return;
  engine.context.resume().catch(() => {});
}

// Kept for good: Safari can suspend it again
export function listenForUnlock(): void {
  if (isListening || typeof window === 'undefined') return;
  isListening = true;
  window.addEventListener('pointerdown', unlockSound, { capture: true });
  window.addEventListener('keydown', unlockSound, { capture: true });
}

export function playCue(spec: CueSpec, gainScale?: number): void {
  if (!engine || engine.context.state !== 'running') return;

  try {
    const { context, master } = engine;
    renderCue(context, master, spec, context.currentTime, gainScale);
  } catch {
    // A sound never breaks a round
  }
}
