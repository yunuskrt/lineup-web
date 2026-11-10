import { describe, expect, it } from 'vitest';
import { overviewFrom } from '@/lib/api/mock/overview';
import {
  type DemoStep,
  type DemoTimeline,
  demoFrameAt,
  demoTimeline,
  MISS_AFTER_REVEALS,
  sameFrame,
  typedPrefix,
} from '@/lib/landing-demo';
import { MOTION_DURATION_MS as MS } from '@/styles/motion';
import type { Showcase } from '@/types/catalog';

function mockShowcase(): Showcase {
  const showcase = overviewFrom().showcase;
  if (!showcase) throw new Error('The mock has a showcase');
  return showcase;
}

const SHOWCASE = mockShowcase();
const TIMELINE = demoTimeline(SHOWCASE);

function stepAt(timeline: DemoTimeline, index: number) {
  const step = timeline.steps[index];
  if (!step) throw new Error(`No step ${index}`);
  return step;
}

type GuessStep = Extract<DemoStep, { kind: 'reveal' | 'miss' }>;

function guessOf(step: DemoStep) {
  if (step.kind !== 'reveal' && step.kind !== 'miss') {
    throw new Error(`Step ${step.kind} types nothing`);
  }
  return step.guess;
}

function guessSteps(timeline: DemoTimeline): GuessStep[] {
  return timeline.steps.filter(
    (step): step is GuessStep => step.kind === 'reveal' || step.kind === 'miss',
  );
}

// Moments inside one guess, from its start
const TYPING_TWO = MS.demoLead + MS.demoTypeStep + 1;
const SUGGESTING = MS.demoLead + 3 * MS.demoTypeStep + 1;
const HIGHLIGHTED = SUGGESTING + MS.demoSuggest / 2;
const PICKED = MS.demoLead + 3 * MS.demoTypeStep + MS.demoSuggest + 1;
const PENDING = PICKED + MS.demoPick;
const OUTCOME = PENDING + MS.demoPending;

describe('typedPrefix', () => {
  it('types the first three letters of the surname', () => {
    expect(typedPrefix('Gareth Bale')).toBe('Bal');
    expect(typedPrefix('Cristiano Ronaldo')).toBe('Ron');
    expect(typedPrefix('Luka Modrić')).toBe('Mod');
  });

  it('types a mononym and a short surname whole or in part', () => {
    expect(typedPrefix('Casemiro')).toBe('Cas');
    expect(typedPrefix('Marcelo')).toBe('Mar');
    expect(typedPrefix('Li Ka')).toBe('Ka');
  });

  it('counts letters, not code units', () => {
    expect(typedPrefix('Oğuzhan Şimşek')).toBe('Şim');
  });
});

describe('demoTimeline', () => {
  it('starts, names the reveals in order with the miss after two, then holds', () => {
    const kinds = TIMELINE.steps.map((step) => step.kind);
    expect(kinds).toEqual([
      'start',
      'reveal',
      'reveal',
      'miss',
      'reveal',
      'reveal',
      'reveal',
      'reveal',
      'reveal',
      'reveal',
      'hold',
      'fade',
    ]);
    expect(SHOWCASE.demo.reveals).toHaveLength(8);
    const slots = guessSteps(TIMELINE)
      .filter((step) => step.kind === 'reveal')
      .map((step) => step.slot);
    expect(slots).toEqual(SHOWCASE.demo.reveals);
    expect(stepAt(TIMELINE, MISS_AFTER_REVEALS + 1).kind).toBe('miss');
  });

  it('types the response miss, never a name of its own', () => {
    const miss = guessSteps(TIMELINE).find((step) => step.kind === 'miss');
    expect(miss?.guess).toBe(SHOWCASE.demo.miss);
    expect(miss?.slot).toBeNull();
  });

  it('has no shake step without a miss', () => {
    const quiet = demoTimeline({
      ...SHOWCASE,
      demo: { ...SHOWCASE.demo, miss: null },
    });
    expect(quiet.steps.some((step) => step.kind === 'miss')).toBe(false);
    expect(demoFrameAt(quiet, quiet.loopMs - 1).shakes).toBe(0);
    expect(demoFrameAt(quiet, quiet.loopMs - 1).toast).toBeNull();
  });

  it('puts the miss last when there are fewer reveals', () => {
    const one = demoTimeline({
      ...SHOWCASE,
      demo: { ...SHOWCASE.demo, reveals: [SHOWCASE.demo.reveals[0]] },
    });
    expect(guessSteps(one).map((step) => step.kind)).toEqual([
      'reveal',
      'miss',
    ]);
  });

  // Three-letter prefixes: every guess types three
  it('runs eight reveals and the miss in about 35.5 seconds', () => {
    const guess =
      MS.demoLead +
      3 * MS.demoTypeStep +
      MS.demoSuggest +
      MS.demoPick +
      MS.demoPending;
    const expected =
      MS.demoStart +
      8 * (guess + MS.demoReveal) +
      (guess + MS.demoMiss) +
      MS.demoHold +
      MS.demoFade;
    expect(TIMELINE.loopMs).toBe(expected);
    expect(TIMELINE.loopMs).toBe(35_470);
  });

  it('lays steps end to end; the loop is their sum', () => {
    let at = 0;
    for (const step of TIMELINE.steps) {
      expect(step.startMs).toBe(at);
      at += step.durationMs;
    }
    expect(TIMELINE.loopMs).toBe(at);
  });
});

describe('demoFrameAt', () => {
  const first = stepAt(TIMELINE, 1);
  const miss = stepAt(TIMELINE, 3);

  function at(step: DemoStep, local: number) {
    return demoFrameAt(TIMELINE, step.startMs + local);
  }

  it('opens on an empty grid and an empty input', () => {
    const frame = demoFrameAt(TIMELINE, 0);
    expect(frame.revealed).toEqual([]);
    expect(frame.text).toBe('');
  });

  it('types letter by letter, then shows the row, then highlights it', () => {
    const typed = typedPrefix(guessOf(first).name);
    expect(at(first, TYPING_TWO).text).toBe(
      Array.from(typed).slice(0, 2).join(''),
    );
    expect(at(first, TYPING_TWO).suggestion).toBeNull();
    expect(at(first, SUGGESTING).text).toBe(typed);
    expect(at(first, SUGGESTING).suggestion).toBe(guessOf(first));
    expect(at(first, SUGGESTING).isHighlighted).toBe(false);
    expect(at(first, HIGHLIGHTED).isHighlighted).toBe(true);
  });

  it('fills the full name on the pick, then waits on the check', () => {
    const picked = at(first, PICKED);
    expect(picked.text).toBe(guessOf(first).name);
    expect(picked.suggestion).toBeNull();
    expect(picked.isPending).toBe(false);
    expect(at(first, PENDING).isPending).toBe(true);
    expect(at(first, PENDING).revealed).toEqual([]);
  });

  it('reveals the slot and clears the input', () => {
    const frame = at(first, OUTCOME);
    expect(frame.revealed).toEqual([SHOWCASE.demo.reveals[0]]);
    expect(frame.text).toBe('');
    expect(frame.isPending).toBe(false);
  });

  it('shakes on the miss, keeps the text, and toasts', () => {
    const before = at(miss, PENDING);
    const frame = at(miss, OUTCOME);
    expect(before.shakes).toBe(0);
    expect(frame.shakes).toBe(1);
    expect(frame.text).toBe(SHOWCASE.demo.miss?.name);
    expect(frame.toast?.message).toBe('Not in this XI');
    expect(frame.revealed).toHaveLength(MISS_AFTER_REVEALS);
  });

  it('holds on every reveal, then fades', () => {
    const hold = stepAt(TIMELINE, TIMELINE.steps.length - 2);
    const fade = stepAt(TIMELINE, TIMELINE.steps.length - 1);
    expect(at(hold, 1).revealed).toEqual(SHOWCASE.demo.reveals);
    expect(at(hold, 1).isFading).toBe(false);
    expect(at(fade, 1).isFading).toBe(true);
  });

  it('wraps after the fade without a fresh shake', () => {
    const end = demoFrameAt(TIMELINE, TIMELINE.loopMs - 1);
    const next = demoFrameAt(TIMELINE, TIMELINE.loopMs);
    expect(next.loop).toBe(1);
    expect(next.revealed).toEqual([]);
    expect(next.isFading).toBe(false);
    expect(next.shakes).toBe(end.shakes);
    expect(next.toast).toBeNull();
  });

  it('gives each loop its own toast, so it shows again', () => {
    const offset = miss.startMs + OUTCOME;
    const once = demoFrameAt(TIMELINE, offset);
    const twice = demoFrameAt(TIMELINE, TIMELINE.loopMs + offset);
    expect(twice.toast?.id).not.toBe(once.toast?.id);
    expect(twice.shakes).toBe(once.shakes + 1);
  });
});

describe('demoFrameAt edges', () => {
  it('treats time before the start as the start', () => {
    expect(demoFrameAt(TIMELINE, -500)).toEqual(demoFrameAt(TIMELINE, 0));
  });
});

describe('sameFrame', () => {
  const base = demoFrameAt(TIMELINE, 0);

  it('matches a frame rebuilt for the same moment', () => {
    expect(sameFrame(base, demoFrameAt(TIMELINE, 0))).toBe(true);
    expect(sameFrame(base, demoFrameAt(TIMELINE, 10))).toBe(true);
  });

  const PATCHES: [string, Partial<typeof base>][] = [
    ['loop', { loop: 1 }],
    ['text', { text: 'N' }],
    ['isPending', { isPending: true }],
    ['suggestion', { suggestion: SHOWCASE.demo.miss }],
    ['isHighlighted', { isHighlighted: true }],
    ['revealed', { revealed: [8] }],
    ['shakes', { shakes: 1 }],
    ['toast', { toast: { id: 1, message: 'Not in this XI' } }],
    ['isFading', { isFading: true }],
  ];

  it('checks every field a frame has', () => {
    expect(PATCHES.map(([field]) => field).sort()).toEqual(
      Object.keys(base).sort(),
    );
  });

  // A field it ignored would freeze the demo
  it.each(PATCHES)('tells frames apart by %s', (_field, patch) => {
    expect(sameFrame(base, { ...base, ...patch })).toBe(false);
  });
});
