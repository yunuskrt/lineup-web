'use client';

import { useDeferredValue, useEffect, useRef, useState } from 'react';
import {
  GuessInput,
  type GuessInputStatus,
} from '@/components/game/GuessInput';
import {
  GUESS_OUTCOME_OPTIONS,
  sampleDirectoryKey,
  samplePlayer,
  SAMPLE_SUGGESTION_INDEX,
} from '@/lib/dev/samples';
import { guessFeedback } from '@/lib/feedback';
import { suggest } from '@/lib/suggestions';
import { DEV_PREVIEW_BUTTON } from '@/styles/classes';
import type { GuessOutcome, GuessResult } from '@/types/game';

const STATUSES: GuessInputStatus[] = ['live', 'pending', 'locked'];

// One named row, as if found earlier in the run
const NAMED_KEYS = new Set([sampleDirectoryKey('Rhys Harlow')]);
const OPEN_LIST_QUERY = 'har';

const SERVER_DELAY_MS = 600;
const NEXT_ROUND_DELAY_MS = 900;

function verdictFor(outcome: GuessOutcome): GuessResult {
  if (outcome === 'correct_new') {
    return { outcome, player: samplePlayer('4-4-2', 0) };
  }
  if (outcome === 'already_found') {
    return { outcome, playerId: 'sample-0' };
  }
  return { outcome };
}

export function GuessPreview() {
  const [status, setStatus] = useState<GuessInputStatus>('live');
  const [value, setValue] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [nextOutcome, setNextOutcome] = useState<GuessOutcome>('not_in_xi');
  const [submissions, setSubmissions] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const query = useDeferredValue(value);
  const suggestions = suggest(SAMPLE_SUGGESTION_INDEX, query, NAMED_KEYS);

  useEffect(() => () => clearPending(), []);

  function clearPending() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }

  function schedule(delayMs: number, action: () => void) {
    clearPending();
    timer.current = setTimeout(action, delayMs);
  }

  function apply(result: GuessResult) {
    const feedback = guessFeedback(result);
    if (feedback.clearInput) setValue('');
    if (feedback.shakeInput) setShakeKey((key) => key + 1);
    if (result.outcome === 'correct_new') {
      setStatus('locked');
      schedule(NEXT_ROUND_DELAY_MS, () => setStatus('live'));
      return;
    }
    setStatus('live');
  }

  function handleSubmit(guess: string) {
    setSubmissions((current) => [guess, ...current]);
    setStatus('pending');
    schedule(SERVER_DELAY_MS, () => apply(verdictFor(nextOutcome)));
  }

  // Focus moves back so the list can open
  function openList() {
    forceStatus('live');
    setValue(OPEN_LIST_QUERY);
    document.querySelector<HTMLInputElement>('[role="combobox"]')?.focus();
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
          {GUESS_OUTCOME_OPTIONS.map((outcome) => (
            <button
              key={outcome.value}
              type="button"
              aria-pressed={nextOutcome === outcome.value}
              className={DEV_PREVIEW_BUTTON}
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
              className={DEV_PREVIEW_BUTTON}
              onClick={() => forceStatus(option)}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            onClick={() => setShakeKey((key) => key + 1)}
          >
            Shake
          </button>
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            onClick={openList}
          >
            Open list
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
          suggestions={suggestions}
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
