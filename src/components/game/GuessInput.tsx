'use client';

import { motion, useAnimate } from 'motion/react';
import { type SubmitEvent, useEffect, useId, useRef, useState } from 'react';
import { useChangedSinceMount } from '@/hooks/use-changed-since-mount';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MAX_GUESS_LENGTH } from '@/lib/api/schemas/common';
import { prepareGuess } from '@/lib/guess';
import { cooldownAnnouncement, cooldownLabel } from '@/lib/system-states';
import { FOCUS_RING } from '@/styles/classes';
import { MOTION_SECONDS } from '@/styles/motion';

export type GuessInputStatus = 'live' | 'pending' | 'locked' | 'cooldown';

const SHAKE_X = [0, -6, 6, -4, 4, 0];
const SPIN_SECONDS = 0.8;
const COOLDOWN_TICK_MS = 250;

// Read-only keeps focus, so show a quieter ring
const INERT_FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-dim';

const STATUS_CLASSES: Record<GuessInputStatus, string> = {
  live: `border-you text-fg ${FOCUS_RING}`,
  pending: `cursor-progress border-line text-fg-muted ${INERT_FOCUS_RING}`,
  locked: `cursor-not-allowed border-line text-fg-dim ${INERT_FOCUS_RING}`,
  cooldown: `cursor-not-allowed border-warning text-fg-muted ${INERT_FOCUS_RING}`,
};

const REJECT_TINT_OPACITY = [1, 1, 0];

// Static when spinning is off, so the busy cue stays
function Spinner({ isSpinning }: { isSpinning: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <motion.svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        className="size-4"
        animate={isSpinning ? { rotate: 360 } : undefined}
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

// Ticks to the server's retry time; decides nothing
function CooldownLine({ until }: { until: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), COOLDOWN_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <p aria-hidden="true" className="text-12 font-medium text-warning">
      {cooldownLabel(until - now)}
    </p>
  );
}

// Keyed per lockout, so it is read once
function CooldownAnnouncement({ until }: { until: number }) {
  const [message] = useState(() => cooldownAnnouncement(until - Date.now()));
  return message;
}

type GuessInputProps = {
  status: GuessInputStatus;
  // Required for `cooldown`; the line counts to it
  cooldownUntil?: number;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (guess: string) => void;
  shakeKey: number;
};

export function GuessInput({
  status,
  cooldownUntil,
  value,
  onValueChange,
  onSubmit,
  shakeKey,
}: GuessInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const runs = useMotionPolicy();
  const canShake = runs('inputShake');
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const hasShaken = useChangedSinceMount(shakeKey);
  const shakenKey = useRef(shakeKey);
  const isCoolingDown = status === 'cooldown' && cooldownUntil !== undefined;

  useEffect(() => {
    if (status === 'live') inputRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (shakeKey === shakenKey.current) return;
    shakenKey.current = shakeKey;
    if (!canShake) return;
    animate(
      scope.current,
      { x: SHAKE_X },
      { duration: MOTION_SECONDS.inputShake },
    );
  }, [animate, canShake, scope, shakeKey]);

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
        <span aria-hidden="true" className="text-12 text-fg-muted">
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
          aria-disabled={status === 'locked' || status === 'cooldown'}
          placeholder="Name a player…"
          maxLength={MAX_GUESS_LENGTH}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={`w-full rounded-sm border bg-surface-card py-2.5 pr-10 pl-3 text-16 font-medium placeholder:text-fg-dim ${STATUS_CLASSES[status]}`}
        />
        {hasShaken && runs('inputRejectTint') ? (
          <motion.span
            key={shakeKey}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-sm border-2 border-danger"
            initial={{ opacity: 1 }}
            animate={{ opacity: REJECT_TINT_OPACITY }}
            transition={{
              duration: MOTION_SECONDS.inputShake,
              times: [0, 0.5, 1],
              ease: 'easeIn',
            }}
          />
        ) : null}
        {status === 'pending' ? (
          <Spinner isSpinning={runs('inputSpinner')} />
        ) : null}
      </div>
      {isCoolingDown ? <CooldownLine until={cooldownUntil} /> : null}
      <p role="status" className="sr-only">
        {isCoolingDown ? (
          <CooldownAnnouncement key={cooldownUntil} until={cooldownUntil} />
        ) : null}
      </p>
    </form>
  );
}
