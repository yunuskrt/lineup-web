import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MOTION_DURATION_MS,
  MOTION_EFFECTS,
  MOTION_SECONDS,
  motionFor,
  REDUCED_MOTION_POLICY,
  REVEAL_SPRING,
  SKELETON_PULSE,
} from '@/styles/motion';

describe('MOTION_SECONDS', () => {
  it('mirrors every duration, in seconds', () => {
    expect(Object.keys(MOTION_SECONDS)).toEqual(
      Object.keys(MOTION_DURATION_MS),
    );
    for (const [key, ms] of Object.entries(MOTION_DURATION_MS)) {
      expect(MOTION_SECONDS[key as keyof typeof MOTION_SECONDS]).toBe(
        ms / 1000,
      );
    }
  });
});

describe('REVEAL_SPRING', () => {
  it('springs over the 320ms reveal from theme.md', () => {
    expect(REVEAL_SPRING.type).toBe('spring');
    expect(REVEAL_SPRING.visualDuration).toBe(MOTION_DURATION_MS.reveal / 1000);
  });
});

describe('SKELETON_PULSE', () => {
  it('loops the 1.6s ease-in-out pulse from theme.md', () => {
    expect(SKELETON_PULSE.duration).toBe(1.6);
    expect(SKELETON_PULSE.ease).toBe('easeInOut');
    expect(SKELETON_PULSE.repeat).toBe(Infinity);
  });
});

const MOVING = [
  'ringCriticalPulse',
  'revealSpring',
  'slotMove',
  'skeletonPulse',
  'lifeShake',
  'inputShake',
  'toastRise',
  'turnChipSlide',
  'lobbyPulse',
  'coinFlipScale',
] as const;

const CUES = [
  'timerColorShift',
  'revealFlash',
  'alreadyFoundPulse',
  'lifeFill',
  'lifeLostFlash',
  'inputRejectTint',
  'toastFade',
  'turnBorderShift',
  'gateFade',
] as const;

// Information, not decoration, despite moving
const ESSENTIAL = ['ringSweep', 'inputSpinner'] as const;

describe('REDUCED_MOTION_POLICY', () => {
  it('decides every effect, and only those', () => {
    expect(Object.keys(REDUCED_MOTION_POLICY).sort()).toEqual(
      [...MOTION_EFFECTS].sort(),
    );
  });

  it('never stops the ring, which carries the time left', () => {
    expect(REDUCED_MOTION_POLICY.ringSweep).toBe('keep');
  });

  it('drops every shake, spring, slide and ambient loop', () => {
    for (const effect of MOVING) {
      expect(REDUCED_MOTION_POLICY[effect], effect).toBe('drop');
    }
  });

  it('keeps the colour and opacity cues the game speaks through', () => {
    for (const effect of [...CUES, ...ESSENTIAL]) {
      expect(REDUCED_MOTION_POLICY[effect], effect).toBe('keep');
    }
  });

  // A new effect must be sorted here before it ships
  it('sorts every effect as movement, a cue or essential', () => {
    expect([...MOVING, ...CUES, ...ESSENTIAL].sort()).toEqual(
      [...MOTION_EFFECTS].sort(),
    );
  });
});

describe('motionFor', () => {
  it('runs everything without the preference', () => {
    for (const effect of MOTION_EFFECTS) {
      expect(motionFor(effect, false), effect).toBe(true);
    }
  });

  it('animates until the preference is known', () => {
    expect(motionFor('revealSpring', null)).toBe(true);
  });

  it('drops only the dropped effects under reduced motion', () => {
    expect(motionFor('revealSpring', true)).toBe(false);
    expect(motionFor('revealFlash', true)).toBe(true);
    expect(motionFor('ringSweep', true)).toBe(true);
  });
});

describe('stylesheets', () => {
  function cssFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return cssFiles(path);
      return entry.name.endsWith('.css') ? [path] : [];
    });
  }

  // Would stop the ring for reduced-motion players
  it('never switch motion off globally', () => {
    const files = cssFiles(join(process.cwd(), 'src'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const css = readFileSync(file, 'utf8');
      const blocks = css.split('@media').slice(1);
      for (const block of blocks) {
        if (!block.includes('prefers-reduced-motion')) continue;
        expect(block, file).not.toMatch(/(animation|transition)\s*:\s*none/);
      }
    }
  });
});
