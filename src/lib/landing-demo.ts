import { FEEDBACK_MESSAGES } from '@/lib/feedback';
import { MOTION_DURATION_MS } from '@/styles/motion';
import type { Showcase, ShowcaseMiss } from '@/types/catalog';
import type { ToastMessage } from '@/types/feedback';

// A name the demo types, from the response
export type DemoGuess = ShowcaseMiss;

type GuessKind = 'reveal' | 'miss';

export type DemoStep =
  | { kind: 'start' | 'hold' | 'fade'; startMs: number; durationMs: number }
  | {
      kind: GuessKind;
      startMs: number;
      durationMs: number;
      guess: DemoGuess;
      typed: string;
      // Null for the miss: it fills nothing
      slot: number | null;
    };

export type DemoTimeline = { steps: DemoStep[]; loopMs: number };

export type DemoFrame = {
  loop: number;
  text: string;
  isPending: boolean;
  suggestion: DemoGuess | null;
  isHighlighted: boolean;
  revealed: number[];
  // Across loops, so a wrap never shakes
  shakes: number;
  toast: ToastMessage | null;
  isFading: boolean;
};

const PREFIX_LETTERS = 3;

// The wrong guess lands after this many reveals
export const MISS_AFTER_REVEALS = 2;

const MS = MOTION_DURATION_MS;

// The surname's first letters, as a player types
export function typedPrefix(name: string): string {
  const words = name.trim().split(/\s+/);
  return Array.from(words.at(-1) ?? name)
    .slice(0, PREFIX_LETTERS)
    .join('');
}

type GuessPhases = {
  typingEnd: number;
  suggestEnd: number;
  pickEnd: number;
  pendingEnd: number;
};

function phasesOf(typed: string): GuessPhases {
  const typingEnd = MS.demoLead + Array.from(typed).length * MS.demoTypeStep;
  const suggestEnd = typingEnd + MS.demoSuggest;
  const pickEnd = suggestEnd + MS.demoPick;
  return {
    typingEnd,
    suggestEnd,
    pickEnd,
    pendingEnd: pickEnd + MS.demoPending,
  };
}

type GuessPlan = { kind: GuessKind; guess: DemoGuess; slot: number | null };

function guessPlan({ players, demo }: Showcase): GuessPlan[] {
  const reveals = demo.reveals.flatMap((slot): GuessPlan[] => {
    const player = players.find((candidate) => candidate.slot === slot);
    if (!player) return [];
    const { name, imageUrl, directoryKey } = player;
    return [{ kind: 'reveal', guess: { name, imageUrl, directoryKey }, slot }];
  });
  if (!demo.miss) return reveals;

  const at = Math.min(MISS_AFTER_REVEALS, reveals.length);
  const miss: GuessPlan = { kind: 'miss', guess: demo.miss, slot: null };
  return [...reveals.slice(0, at), miss, ...reveals.slice(at)];
}

// Plays back the response's script; decides nothing
export function demoTimeline(showcase: Showcase): DemoTimeline {
  const steps: DemoStep[] = [];
  let at = 0;
  const push = (step: DemoStep) => {
    steps.push(step);
    at += step.durationMs;
  };

  push({ kind: 'start', startMs: at, durationMs: MS.demoStart });
  for (const plan of guessPlan(showcase)) {
    const typed = typedPrefix(plan.guess.name);
    const rest = plan.kind === 'reveal' ? MS.demoReveal : MS.demoMiss;
    const durationMs = phasesOf(typed).pendingEnd + rest;
    push({ ...plan, typed, startMs: at, durationMs });
  }
  push({ kind: 'hold', startMs: at, durationMs: MS.demoHold });
  push({ kind: 'fade', startMs: at, durationMs: MS.demoFade });

  return { steps, loopMs: at };
}

type GuessView = Pick<
  DemoFrame,
  'text' | 'isPending' | 'suggestion' | 'isHighlighted'
>;

const IDLE_GUESS: GuessView = {
  text: '',
  isPending: false,
  suggestion: null,
  isHighlighted: false,
};

// What the input shows partway through one guess
function guessView(
  step: Extract<DemoStep, { kind: GuessKind }>,
  local: number,
): GuessView {
  const phases = phasesOf(step.typed);
  if (local < MS.demoLead) return IDLE_GUESS;
  if (local < phases.typingEnd) {
    const letters = Math.floor((local - MS.demoLead) / MS.demoTypeStep) + 1;
    const text = Array.from(step.typed).slice(0, letters).join('');
    return { ...IDLE_GUESS, text };
  }
  if (local < phases.suggestEnd) {
    const isHighlighted = local >= phases.typingEnd + MS.demoSuggest / 2;
    return {
      ...IDLE_GUESS,
      text: step.typed,
      suggestion: step.guess,
      isHighlighted,
    };
  }
  if (local < phases.pickEnd) return { ...IDLE_GUESS, text: step.guess.name };
  if (local < phases.pendingEnd) {
    return { ...IDLE_GUESS, text: step.guess.name, isPending: true };
  }
  // The miss keeps its text; a reveal clears it
  return step.kind === 'miss'
    ? { ...IDLE_GUESS, text: step.guess.name }
    : IDLE_GUESS;
}

export function demoFrameAt(
  timeline: DemoTimeline,
  elapsedMs: number,
): DemoFrame {
  const { steps, loopMs } = timeline;
  const loop = Math.floor(Math.max(0, elapsedMs) / loopMs);
  const t = Math.max(0, elapsedMs) - loop * loopMs;
  const missesPerLoop = steps.filter((step) => step.kind === 'miss').length;

  const revealed: number[] = [];
  let shakes = 0;
  let view = IDLE_GUESS;
  let isFading = false;

  for (const step of steps) {
    if (t < step.startMs) break;
    const local = t - step.startMs;
    const isCurrent = local < step.durationMs;

    if (step.kind === 'reveal' || step.kind === 'miss') {
      const { pendingEnd } = phasesOf(step.typed);
      if (local >= pendingEnd) {
        if (step.kind === 'reveal' && step.slot !== null) {
          revealed.push(step.slot);
        } else {
          shakes += 1;
        }
      }
      if (isCurrent) view = guessView(step, local);
    } else if (step.kind === 'fade') {
      isFading = isCurrent;
    }
  }

  return {
    loop,
    ...view,
    revealed,
    shakes: loop * missesPerLoop + shakes,
    toast:
      shakes > 0 ? { id: loop + 1, message: FEEDBACK_MESSAGES.notInXi } : null,
    isFading,
  };
}

export function sameFrame(a: DemoFrame, b: DemoFrame): boolean {
  return (
    a.loop === b.loop &&
    a.text === b.text &&
    a.isPending === b.isPending &&
    a.suggestion === b.suggestion &&
    a.isHighlighted === b.isHighlighted &&
    a.revealed.length === b.revealed.length &&
    a.shakes === b.shakes &&
    a.toast?.id === b.toast?.id &&
    a.isFading === b.isFading
  );
}
