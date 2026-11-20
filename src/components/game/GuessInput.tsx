'use client';

import React, {
  type KeyboardEvent,
  type SubmitEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { motion, useAnimate } from 'motion/react';
import CooldownAnnouncement from '@/components/game/guess-input/CooldownAnnouncement';
import CooldownLine from '@/components/game/guess-input/CooldownLine';
import Spinner from '@/components/game/guess-input/Spinner';
import SuggestionList from '@/components/game/SuggestionList';
import { useChangedSinceMount } from '@/hooks/use-changed-since-mount';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MAX_GUESS_LENGTH } from '@/lib/api/schemas/common';
import { prepareGuess } from '@/lib/guess';
import {
  stepHighlight,
  type Suggestion,
  suggestionCountLabel,
} from '@/lib/suggestions';
import { FOCUS_RING, SECTION_LABEL } from '@/styles/classes';
import { MOTION_SECONDS } from '@/styles/motion';

export type GuessInputStatus = 'live' | 'pending' | 'locked' | 'cooldown';

const SHAKE_X = [0, -6, 6, -4, 4, 0];

// Read-only keeps focus, so show a quieter ring
const INERT_FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-dim';

// Live stands proud on its shadow; the rest sit flat
const STATUS_CLASSES: Record<GuessInputStatus, string> = {
  live: `text-fg shadow-hard-sm ${FOCUS_RING}`,
  pending: `cursor-progress text-fg-muted ${INERT_FOCUS_RING}`,
  locked: `cursor-not-allowed text-fg-dim ${INERT_FOCUS_RING}`,
  cooldown: `cursor-not-allowed text-fg-muted ${INERT_FOCUS_RING}`,
};

const REJECT_TINT_OPACITY = [1, 1, 0];

type Props = {
  status: GuessInputStatus;
  // Required for `cooldown`; the line counts to it
  cooldownUntil?: number;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (guess: string) => void;
  shakeKey: number;
  // Typing aid only; a pick is a plain text guess
  suggestions?: readonly Suggestion[];
  // Landing demo: the list opens without focus
  drivenHighlight?: string | null;
};

const NO_SUGGESTIONS: readonly Suggestion[] = [];

const GuessInput = ({
  status,
  cooldownUntil,
  value,
  onValueChange,
  onSubmit,
  shakeKey,
  suggestions = NO_SUGGESTIONS,
  drivenHighlight,
}: Props) => {
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const runs = useMotionPolicy();
  const canShake = runs('inputShake');
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const hasShaken = useChangedSinceMount(shakeKey);
  const shakenKey = useRef(shakeKey);
  const isCoolingDown = status === 'cooldown' && cooldownUntil !== undefined;
  const [isFocused, setIsFocused] = useState(false);
  // Escape, or a sent guess, until the text changes
  const [isDismissed, setIsDismissed] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const isDriven = drivenHighlight !== undefined;
  const isListOpen =
    status === 'live' &&
    (isDriven || (isFocused && !isDismissed)) &&
    suggestions.length > 0;
  const highlightKey = isDriven ? drivenHighlight : highlightedKey;
  const highlighted = isListOpen
    ? (suggestions.find(
        (item) => item.player.key === highlightKey && !item.isNamed,
      ) ?? null)
    : null;
  const optionId = (key: string) => `${listId}-${key}`;

  useEffect(() => {
    if (status === 'live' && !isDriven) inputRef.current?.focus();
  }, [isDriven, status]);

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

  useEffect(() => {
    // A driven list must never scroll the page
    if (!highlighted || isDriven) return;
    document
      .getElementById(`${listId}-${highlighted.player.key}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlighted, isDriven, listId]);

  function send(text: string) {
    const guess = prepareGuess(text);
    if (guess === null) return;
    setIsDismissed(true);
    onSubmit(guess);
  }

  function pick({ player }: Suggestion) {
    if (status !== 'live') return;
    onValueChange(player.name);
    send(player.name);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== 'live') return;
    if (highlighted) pick(highlighted);
    else send(value);
  }

  function handleChange(next: string) {
    setIsDismissed(false);
    setHighlightedKey(null);
    onValueChange(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isListOpen) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedKey(
        stepHighlight(suggestions, highlighted?.player.key ?? null, direction),
      );
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsDismissed(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={inputId} className={SECTION_LABEL}>
          Guess a player
        </label>
        <span aria-hidden="true" className="text-12 text-fg-muted">
          Press Enter ↵
        </span>
      </div>
      <div ref={scope} className="relative">
        {isListOpen ? (
          <SuggestionList
            id={listId}
            suggestions={suggestions}
            highlightedKey={highlighted?.player.key ?? null}
            optionId={optionId}
            onPick={pick}
          />
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isListOpen}
          aria-controls={isListOpen ? listId : undefined}
          aria-activedescendant={
            highlighted ? optionId(highlighted.player.key) : undefined
          }
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          readOnly={status !== 'live'}
          aria-busy={status === 'pending'}
          aria-disabled={status === 'locked' || status === 'cooldown'}
          placeholder="Name a player…"
          maxLength={MAX_GUESS_LENGTH}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={`w-full rounded-md border-2 border-line bg-surface-card py-2.25 pr-10 pl-3 text-16 font-medium placeholder:text-fg-dim ${STATUS_CLASSES[status]}`}
        />
        {hasShaken && runs('inputRejectTint') ? (
          <motion.span
            key={shakeKey}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-md border-2 border-danger"
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
      <p role="status" className="sr-only">
        {isListOpen ? suggestionCountLabel(suggestions.length) : ''}
      </p>
    </form>
  );
};

export default GuessInput;
