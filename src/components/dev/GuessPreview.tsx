'use client';

import { useEffect, useRef, useState } from 'react';
import {
  GuessInput,
  type GuessInputStatus,
} from '@/components/game/GuessInput';
import { FOCUS_RING } from '@/styles/classes';
import type { GuessOutcome } from '@/types/game';

const OUTCOMES: { value: GuessOutcome; label: string }[] = [
  { value: 'correct_new', label: 'Correct new' },
  { value: 'already_found', label: 'Already found' },
  { value: 'not_in_xi', label: 'Not in XI' },
];

const STATUSES: GuessInputStatus[] = ['live', 'pending', 'locked'];

const SERVER_DELAY_MS = 600;
const NEXT_ROUND_DELAY_MS = 900;

const BUTTON = `rounded-sm border border-line px-3 py-1.5 text-14 text-fg hover:bg-surface-raised aria-pressed:bg-surface-card ${FOCUS_RING}`;

export function GuessPreview() {
  const [status, setStatus] = useState<GuessInputStatus>('live');
  const [value, setValue] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [nextOutcome, setNextOutcome] = useState<GuessOutcome>('not_in_xi');
  const [submissions, setSubmissions] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearPending(), []);

  function clearPending() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }

  function schedule(delayMs: number, action: () => void) {
    clearPending();
    timer.current = setTimeout(action, delayMs);
  }

  function applyOutcome(outcome: GuessOutcome) {
    if (outcome === 'correct_new') {
      setValue('');
      setStatus('locked');
      schedule(NEXT_ROUND_DELAY_MS, () => setStatus('live'));
      return;
    }
    if (outcome === 'already_found') setValue('');
    if (outcome === 'not_in_xi') setShakeKey((key) => key + 1);
    setStatus('live');
  }

  function handleSubmit(guess: string) {
    setSubmissions((current) => [guess, ...current]);
    setStatus('pending');
    schedule(SERVER_DELAY_MS, () => applyOutcome(nextOutcome));
  }

  function forceStatus(next: GuessInputStatus) {
    clearPending();
    setStatus(next);
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
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-12 text-fg-muted">Force status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={status === option}
              className={BUTTON}
              onClick={() => forceStatus(option)}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            className={BUTTON}
            onClick={() => setShakeKey((key) => key + 1)}
          >
            Shake
          </button>
        </div>
      </div>
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface-raised p-4">
        <GuessInput
          status={status}
          value={value}
          onValueChange={setValue}
          onSubmit={handleSubmit}
          shakeKey={shakeKey}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-12 text-fg-muted">
          Submitted ({submissions.length})
        </p>
        <ol aria-label="Submitted guesses" className="flex flex-col gap-1">
          {submissions.map((guess, index) => (
            <li
              key={submissions.length - index}
              className="font-mono text-14 break-all whitespace-pre-wrap text-fg"
            >
              {JSON.stringify(guess)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
