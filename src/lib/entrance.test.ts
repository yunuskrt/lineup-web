import { describe, expect, it } from 'vitest';
import { ENTRANCE_SHOWN, entranceItemProps } from '@/lib/entrance';
import {
  LANDING_RISE_PX,
  LANDING_STAGGER_MS,
  LANDING_TIGHT_STAGGER_MS,
  MOTION_SECONDS,
} from '@/styles/motion';

const WAITING = { animates: true, isInView: false };
const SEEN = { animates: true, isInView: true };

describe('entranceItemProps', () => {
  // Reduced motion must never leave content hidden
  it('shows at once without motion, seen or not', () => {
    for (const isInView of [false, true]) {
      const props = entranceItemProps({ animates: false, isInView }, 3);
      expect(props.initial).toBe(false);
      expect(props.animate).toEqual(ENTRANCE_SHOWN);
      expect(props.transition).toEqual({ duration: 0 });
    }
  });

  it('waits hidden, 8px down, until the group is seen', () => {
    const props = entranceItemProps(WAITING, 0);
    expect(props.initial).toEqual({ opacity: 0, y: LANDING_RISE_PX });
    expect(props.animate).toEqual(props.initial);
  });

  it('rises into place once seen, over the landing rise', () => {
    const props = entranceItemProps(SEEN, 0);
    expect(props.animate).toEqual(ENTRANCE_SHOWN);
    expect(props.transition).toMatchObject({
      duration: MOTION_SECONDS.landingRise,
      delay: 0,
      ease: 'easeOut',
    });
  });

  it('staggers items 60ms apart by default', () => {
    const third = entranceItemProps(SEEN, 2);
    expect(third.transition).toMatchObject({
      delay: (2 * LANDING_STAGGER_MS) / 1000,
    });
  });

  it('adds a start delay, for crests after the logos', () => {
    const props = entranceItemProps(SEEN, 1, {
      staggerMs: LANDING_TIGHT_STAGGER_MS,
      delayMs: 440,
    });
    expect(props.transition).toMatchObject({
      delay: (440 + LANDING_TIGHT_STAGGER_MS) / 1000,
    });
  });

  it('grows from a scale instead of rising when asked', () => {
    const props = entranceItemProps(WAITING, 0, { fromScale: 0.92 });
    expect(props.initial).toEqual({ opacity: 0, scale: 0.92 });
    expect(entranceItemProps(SEEN, 0, { fromScale: 0.92 }).animate).toEqual(
      ENTRANCE_SHOWN,
    );
  });
});
