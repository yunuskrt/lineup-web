'use client';

import { useEffect, useRef, useState } from 'react';
import { FeedbackToast } from '@/components/game/FeedbackToast';
import {
  GuessInput,
  type GuessInputStatus,
} from '@/components/game/GuessInput';
import { SquadGrid } from '@/components/pitch/SquadGrid';
import { guessFeedback } from '@/lib/feedback';
import { slotLayout } from '@/lib/formation';
import { FOCUS_RING } from '@/styles/classes';
import type { GridPulse, ToastMessage } from '@/types/feedback';
import type { GuessOutcome, GuessResult } from '@/types/game';
import type { FoundPlayer } from '@/types/player';

const FORMATION = '4-4-2';

const SAMPLE_NAMES = [
  'Gareth Pennock',
  'Dean Harlow',
  "Ciarán O'Donovan",
  'Stuart Fenwick',
  'Rhys Harlow',
  'Christophe Delacroix-Morel',
  'Íñigo Castañeda',
  'Jasper van der Linde',
  'Kofi Addo-Mensah',
  'Tavinho',
  'Wes Tolland',
];

// Scattered so reveals land across the pitch, not in slot order
const REVEAL_ORDER = [0, 4, 7, 10, 2, 9, 5, 1, 8, 3, 6];

const STARTING_REVEALED = 4;

const OUTCOMES: { value: GuessOutcome; label: string }[] = [
  { value: 'correct_new', label: 'Correct new' },
  { value: 'already_found', label: 'Already found' },
  { value: 'not_in_xi', label: 'Not in XI' },
];

const SERVER_DELAY_MS = 400;

const BUTTON = `rounded-sm border border-line px-3 py-1.5 text-14 text-fg hover:bg-surface-raised aria-pressed:bg-surface-card ${FOCUS_RING}`;

function samplePlayer(slot: number): FoundPlayer {
  return {
    id: `sample-${slot}`,
    name: SAMPLE_NAMES[slot],
    slot,
    position: slotLayout(FORMATION)?.[slot]?.position ?? 'GK',
    imageUrl: null,
  };
}

const INITIAL_REVEALED = REVEAL_ORDER.slice(0, STARTING_REVEALED).map(
  samplePlayer,
);

export function FeedbackPreview() {
  const [revealed, setRevealed] = useState<FoundPlayer[]>(INITIAL_REVEALED);
  const [status, setStatus] = useState<GuessInputStatus>('live');
  const [value, setValue] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [pulse, setPulse] = useState<GridPulse>();
  const [nextOutcome, setNextOutcome] = useState<GuessOutcome>('already_found');
  const [pulseCursor, setPulseCursor] = useState(0);
  const eventCount = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  function verdictFor(outcome: GuessOutcome): GuessResult {
    if (outcome === 'correct_new') {
      const taken = new Set(revealed.map((player) => player.slot));
      const slot = REVEAL_ORDER.find((candidate) => !taken.has(candidate));
      if (slot !== undefined) {
        return { outcome, player: samplePlayer(slot) };
      }
      return { outcome: 'already_found', playerId: revealed[0].id };
    }
    if (outcome === 'already_found') {
      const player = revealed[pulseCursor % revealed.length];
      setPulseCursor((cursor) => cursor + 1);
      return { outcome, playerId: player.id };
    }
    return { outcome };
  }

  function apply(result: GuessResult) {
    const feedback = guessFeedback(result);
    eventCount.current += 1;
    const key = eventCount.current;

    if (result.outcome === 'correct_new') {
      setRevealed((current) => [...current, result.player]);
    }
    setToast(
      feedback.toast === null ? null : { id: key, message: feedback.toast },
    );
    if (feedback.clearInput) setValue('');
    if (feedback.shakeInput) setShakeKey((current) => current + 1);
    if (feedback.pulsePlayerId !== null) {
      setPulse({ playerId: feedback.pulsePlayerId, key });
    }
    setStatus('live');
  }

  function handleSubmit() {
    const result = verdictFor(nextOutcome);
    setStatus('pending');
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => apply(result), SERVER_DELAY_MS);
  }

  function reset() {
    if (timer.current !== null) clearTimeout(timer.current);
    setRevealed(INITIAL_REVEALED);
    setStatus('live');
    setValue('');
    setToast(null);
    setPulse(undefined);
    setPulseCursor(0);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-12 text-fg-muted">Next outcome</p>
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map((outcome) => (
            <button
              key={outcome.value}
              type="button"
              aria-pressed={nextOutcome === outcome.value}
              className={BUTTON}
              onClick={() => setNextOutcome(outcome.value)}
            >
              {outcome.label}
            </button>
          ))}
          <button type="button" className={BUTTON} onClick={reset}>
            Reset
          </button>
        </div>
        <p className="text-12 text-fg-muted">
          Type anything and press Enter; the verdict is the one picked above.
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2 rounded-lg border border-line bg-surface-raised p-2">
        <div className="h-96">
          <SquadGrid formation={FORMATION} revealed={revealed} pulse={pulse} />
        </div>
        <FeedbackToast toast={toast} />
        <GuessInput
          status={status}
          value={value}
          onValueChange={setValue}
          onSubmit={handleSubmit}
          shakeKey={shakeKey}
        />
      </div>
    </div>
  );
}
