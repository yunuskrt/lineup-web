'use client';

import { useEffect, useRef } from 'react';
import { SoundToggle } from '@/components/game/SoundToggle';
import { useSound } from '@/hooks/use-sound';
import { DEV_PREVIEW_BUTTON } from '@/styles/classes';
import {
  FINAL_BEEP_FROM,
  OPPONENT_TICK_GAIN,
  finalBeepFor,
} from '@/styles/sound';
import type { SoundCue } from '@/types/sound';

const SECOND_MS = 1000;

const CUE_EVENTS: { cue: SoundCue; event: string }[] = [
  { cue: 'correctNew', event: 'You name a new player' },
  { cue: 'theirReveal', event: 'Opponent names a new player' },
  { cue: 'notInXi', event: 'Not in this XI' },
  { cue: 'alreadyNamed', event: 'Already named' },
  { cue: 'tick', event: 'Each second, 14 → 6' },
  { cue: 'lifeLost', event: 'You lose a life' },
  { cue: 'theirLifeLost', event: 'Opponent loses a life' },
  { cue: 'turnToYou', event: 'The turn passes to you' },
  { cue: 'opponentFound', event: 'Matchmaking pairs you' },
  { cue: 'resultWin', event: 'Duel win or forfeit win' },
  { cue: 'resultDraw', event: 'Duel draw' },
  { cue: 'resultLoss', event: 'Duel loss' },
  { cue: 'perfectClear', event: 'Solo: all 11 named' },
  { cue: 'runOver', event: 'Solo: lives at 0' },
];

const FINAL_SECONDS = Array.from(
  { length: FINAL_BEEP_FROM },
  (_, i) => FINAL_BEEP_FROM - i,
);

export function SoundPreview() {
  const { play } = useSound();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function playFinalFive() {
    timers.current.forEach(clearTimeout);
    timers.current = FINAL_SECONDS.map((seconds, i) =>
      setTimeout(() => {
        const beep = finalBeepFor(seconds);
        if (beep) play(beep);
      }, i * SECOND_MS),
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Mute</h2>
        <div className="flex items-center gap-3">
          <SoundToggle />
          <p className="text-14 text-fg-muted">
            Nothing plays until the first click or key press.
          </p>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Clock</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            onClick={playFinalFive}
          >
            Final 5
          </button>
          {FINAL_SECONDS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={DEV_PREVIEW_BUTTON}
              onClick={() => {
                const beep = finalBeepFor(seconds);
                if (beep) play(beep);
              }}
            >
              {seconds}s
            </button>
          ))}
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            onClick={() => play('tick', { gainScale: OPPONENT_TICK_GAIN })}
          >
            Their tick, half gain
          </button>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Cues</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CUE_EVENTS.map(({ cue, event }) => (
            <li key={cue}>
              <button
                type="button"
                className={`flex w-full flex-col items-start gap-0.5 text-left ${DEV_PREVIEW_BUTTON}`}
                onClick={() => play(cue)}
              >
                <span className="font-semibold">{cue}</span>
                <span className="text-12 text-fg-muted">{event}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
