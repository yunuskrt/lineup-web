import { describe, expect, it } from 'vitest';
import {
  ARC_SPAN,
  arcDashArray,
  countdownStage,
  displaySeconds,
  remainingMs,
  ringStage,
  sweepFraction,
} from '@/lib/countdown';
import type { RoundTiming } from '@/types/game';

const START = 1_700_000_000_000;

function roundOf(durationMs: number): RoundTiming {
  return { startedAt: START, endsAt: START + durationMs };
}

const ROUND = roundOf(15_000);

describe('remainingMs', () => {
  it('counts down to the end of the round', () => {
    expect(remainingMs(ROUND, START)).toBe(15_000);
    expect(remainingMs(ROUND, START + 6_500)).toBe(8_500);
    expect(remainingMs(ROUND, ROUND.endsAt)).toBe(0);
  });

  it('never exceeds the round before it starts', () => {
    expect(remainingMs(ROUND, START - 2_000)).toBe(15_000);
  });

  it('never goes below zero after it ends', () => {
    expect(remainingMs(ROUND, ROUND.endsAt + 400)).toBe(0);
  });
});

describe('displaySeconds', () => {
  it.each([
    [15_000, 15],
    [14_001, 15],
    [14_000, 14],
    [7_001, 8],
    [7_000, 7],
    [3_001, 4],
    [3_000, 3],
    [1, 1],
    [0, 0],
  ])('shows %i ms as %i', (remaining, seconds) => {
    expect(displaySeconds(remaining)).toBe(seconds);
  });
});

describe('sweepFraction', () => {
  it('is full at the start and empty at the end', () => {
    expect(sweepFraction(15_000, ROUND)).toBe(1);
    expect(sweepFraction(0, ROUND)).toBe(0);
  });

  it('is half at the midpoint', () => {
    expect(sweepFraction(remainingMs(ROUND, START + 7_500), ROUND)).toBe(0.5);
  });

  it('drops by equal steps for equal time steps', () => {
    const fractions = [0, 3_000, 6_000, 9_000, 12_000, 15_000].map((elapsed) =>
      sweepFraction(remainingMs(ROUND, START + elapsed), ROUND),
    );
    const steps = fractions.slice(1).map((value, i) => fractions[i] - value);

    for (const step of steps) expect(step).toBeCloseTo(0.2, 10);
  });

  it('stays within 0 and 1', () => {
    expect(sweepFraction(20_000, ROUND)).toBe(1);
    expect(sweepFraction(-500, ROUND)).toBe(0);
  });

  it('is empty for a round with no duration', () => {
    expect(sweepFraction(0, roundOf(0))).toBe(0);
  });
});

describe('countdownStage', () => {
  it.each([
    [15, 'calm'],
    [8, 'calm'],
    [7, 'warning'],
    [4, 'warning'],
    [3, 'critical'],
    [0, 'critical'],
  ] as const)('is %s at %i seconds', (seconds, stage) => {
    expect(countdownStage(seconds)).toBe(stage);
  });

  it('changes stage exactly as 7 and 3 appear', () => {
    expect(countdownStage(displaySeconds(7_001))).toBe('calm');
    expect(countdownStage(displaySeconds(7_000))).toBe('warning');
    expect(countdownStage(displaySeconds(3_001))).toBe('warning');
    expect(countdownStage(displaySeconds(3_000))).toBe('critical');
  });
});

describe('ring and numeral', () => {
  it('never disagree at any point in the round', () => {
    for (let elapsed = 0; elapsed <= 15_000; elapsed += 10) {
      const remaining = remainingMs(ROUND, START + elapsed);
      const seconds = displaySeconds(remaining);
      const sweptSeconds = (sweepFraction(remaining, ROUND) * 15_000) / 1000;

      expect(sweptSeconds).toBeLessThanOrEqual(seconds);
      expect(sweptSeconds).toBeGreaterThan(seconds - 1);
    }
  });
});

describe('other round lengths', () => {
  it.each([10_000, 20_000, 30_000])(
    'starts full and ends empty for a %i ms round',
    (duration) => {
      const round = roundOf(duration);
      const atStart = remainingMs(round, START);

      expect(displaySeconds(atStart)).toBe(duration / 1000);
      expect(sweepFraction(atStart, round)).toBe(1);
      expect(
        sweepFraction(remainingMs(round, START + duration / 2), round),
      ).toBe(0.5);
      expect(sweepFraction(remainingMs(round, round.endsAt), round)).toBe(0);
    },
  );
});

describe('arcDashArray', () => {
  it('draws the whole open arc at full time', () => {
    expect(arcDashArray(1)).toBe(`${ARC_SPAN} 1`);
  });

  it('shrinks in step with time left', () => {
    expect(arcDashArray(0.5)).toBe(`${ARC_SPAN / 2} 1`);
    expect(arcDashArray(0.2)).toBe(`${ARC_SPAN * 0.2} 1`);
  });

  it('draws nothing once time is up', () => {
    expect(arcDashArray(0)).toBe('0 1');
  });

  it('clamps a fraction outside the round', () => {
    expect(arcDashArray(1.4)).toBe(`${ARC_SPAN} 1`);
    expect(arcDashArray(-0.2)).toBe('0 1');
  });
});

describe('ringStage', () => {
  it('escalates your own running clock', () => {
    expect(ringStage('running', 'you', 12)).toBe('calm');
    expect(ringStage('running', 'you', 6)).toBe('warning');
    expect(ringStage('running', 'you', 2)).toBe('critical');
  });

  it('keeps a frozen clock on the stage it stopped at', () => {
    expect(ringStage('frozen', 'you', 3)).toBe('critical');
  });

  it("never escalates the opponent's clock", () => {
    expect(ringStage('running', 'opponent', 6)).toBe('calm');
    expect(ringStage('running', 'opponent', 1)).toBe('calm');
  });

  it('keeps a waiting clock calm', () => {
    expect(ringStage('waiting', 'you', 2)).toBe('calm');
  });
});
