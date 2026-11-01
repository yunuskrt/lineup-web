'use client';

import { useAnimationFrame } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useSound } from '@/hooks/use-sound';
import { activeRing } from '@/lib/canvas';
import { displaySeconds, remainingMs } from '@/lib/countdown';
import { serverClock } from '@/lib/server-clock';
import {
  heardClockCue,
  isLateCue,
  scheduleCues,
  soundCuesFor,
} from '@/lib/sound-cues';
import type { CanvasView } from '@/types/canvas';
import type { HeardSecond } from '@/types/sound';

function useEventSounds(view: CanvasView) {
  const { play } = useSound();
  const previous = useRef<CanvasView | null>(null);
  const lastEventCueAt = useRef(-Infinity);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const last = previous.current;
    previous.current = view;
    // The first view is a load or a resume
    if (!last) return;

    const now = performance.now();
    const cues = scheduleCues(
      soundCuesFor(last, view),
      now - lastEventCueAt.current,
    );
    for (const { cue, delayMs } of cues) {
      if (!isLateCue(cue)) lastEventCueAt.current = now;
      if (delayMs === 0) {
        play(cue);
        continue;
      }
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        play(cue);
      }, delayMs);
      timers.current.add(timer);
    }
  }, [view, play]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
}

// Hears the second the ring shows, on its frame
function useClockSounds(view: CanvasView) {
  const { play } = useSound();
  const heard = useRef<HeardSecond | null>(null);
  const ring = activeRing(view.clock, view.mode === 'duel' ? view.turn : 'you');

  useAnimationFrame(() => {
    if (ring.mode !== 'running') return;

    const { startedAt, endsAt } = ring.round;
    const seconds = displaySeconds(remainingMs(ring.round, serverClock.now()));
    const now = { startedAt, endsAt, seconds };
    const cue = heardClockCue(heard.current, now, ring.owner);
    heard.current = now;
    if (cue) play(cue.cue, { gainScale: cue.gainScale });
  });
}

export function useGameSounds(view: CanvasView) {
  useEventSounds(view);
  useClockSounds(view);
}
