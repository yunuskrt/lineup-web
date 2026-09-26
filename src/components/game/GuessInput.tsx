'use client';

import { motion, useAnimate, useReducedMotion } from 'motion/react';
import { type SubmitEvent, useEffect, useId, useRef, useState } from 'react';
import { MAX_GUESS_LENGTH } from '@/lib/api/schemas/common';
import { prepareGuess } from '@/lib/guess';
import { FOCUS_RING } from '@/styles/classes';
import { MOTION_DURATION_MS } from '@/styles/motion';

export type GuessInputStatus = 'live' | 'pending' | 'locked';

const SHAKE_SECONDS = MOTION_DURATION_MS.inputShake / 1000;
const SHAKE_X = [0, -6, 6, -4, 4, 0];
const SPIN_SECONDS = 0.8;

// Focus stays put while read-only, so it needs a quieter ring
const INERT_FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-dim';

const STATUS_CLASSES: Record<GuessInputStatus, string> = {
  live: `border-you text-fg ${FOCUS_RING}`,
  pending: `cursor-progress border-line text-fg-muted ${INERT_FOCUS_RING}`,
  locked: `cursor-not-allowed border-line text-fg-dim ${INERT_FOCUS_RING}`,
};

const REJECT_TINT_OPACITY = [1, 1, 0];

function Spinner() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <motion.svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        className="size-4"
        animate={{ rotate: 360 }}
        transition={{
          duration: SPIN_SECONDS,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          strokeWidth="2"
          className="stroke-line"
        />
        <path
          d="M8 2a6 6 0 0 1 6 6"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-fg-muted"
        />
      </motion.svg>
      <span className="sr-only">Checking</span>
    </span>
  );
}

type GuessInputProps = {
  status: GuessInputStatus;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (guess: string) => void;
  shakeKey: number;
};

export function GuessInput({
  status,
  value,
  onValueChange,
  onSubmit,
  shakeKey,
}: GuessInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isReducedMotion = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [initialShakeKey] = useState(shakeKey);
  const shakenKey = useRef(shakeKey);

  useEffect(() => {
    if (status === 'live') inputRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (shakeKey === shakenKey.current) return;
    shakenKey.current = shakeKey;
    if (isReducedMotion) return;
    animate(scope.current, { x: SHAKE_X }, { duration: SHAKE_SECONDS });
  }, [animate, isReducedMotion, scope, shakeKey]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== 'live') return;

    const guess = prepareGuess(value);
    if (guess !== null) onSubmit(guess);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={inputId}
          className="text-12 font-medium text-fg-muted uppercase"
        >
          Guess a player
        </label>
        <span aria-hidden="true" className="text-12 text-fg-dim">
          Press Enter ↵
        </span>
      </div>
      <div ref={scope} className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          readOnly={status !== 'live'}
          aria-busy={status === 'pending'}
          aria-disabled={status === 'locked'}
          placeholder="Name a player…"
          maxLength={MAX_GUESS_LENGTH}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={`w-full rounded-sm border bg-surface-card py-2.5 pr-10 pl-3 text-16 font-medium placeholder:text-fg-dim ${STATUS_CLASSES[status]}`}
        />
        {shakeKey !== initialShakeKey ? (
          <motion.span
            key={shakeKey}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-sm border-2 border-danger"
            initial={{ opacity: 1 }}
            animate={{ opacity: REJECT_TINT_OPACITY }}
            transition={{
              duration: SHAKE_SECONDS,
              times: [0, 0.5, 1],
              ease: 'easeIn',
            }}
          />
        ) : null}
        {status === 'pending' ? <Spinner /> : null}
      </div>
    </form>
  );
}
