'use client';

import React, { type SubmitEvent, useId, useState } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import StartError from '@/components/play/StartError';
import { useStartNavigation } from '@/hooks/use-start-navigation';
import { ROOM_CODE_LENGTH } from '@/lib/api/schemas/duel';
import { withQuery } from '@/lib/filters';
import { JOIN_ROW_ID } from '@/lib/play-steps';
import {
  hasLookAlike,
  isRoomCode,
  ROOM_CODE_HINT,
  roomCodeInput,
  withRoom,
} from '@/lib/room-code';
import {
  BOARD_SECTION,
  SECONDARY_BUTTON,
  TYPE_ROOM_CODE,
} from '@/styles/classes';

type Props = {
  // The URL's filters, if any; the creator's apply
  filterParams: URLSearchParams | null;
  initialCode: string;
};

const CODE_SLOTS = Array.from(
  { length: ROOM_CODE_LENGTH },
  (_, index) => index,
);

const JoinRoom = ({ filterParams, initialCode }: Props) => {
  const { go, isBusy, error } = useStartNavigation();
  const [code, setCode] = useState(() => roomCodeInput(initialCode));
  const headingId = useId();
  const inputId = useId();
  const hintId = useId();
  const isValid = isRoomCode(code);
  const showsHint = hasLookAlike(code);

  function join(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    const params = withRoom(filterParams ?? new URLSearchParams(), code);
    void go(withQuery('/play/duel', params));
  }

  return (
    <section
      id={JOIN_ROW_ID}
      aria-labelledby={headingId}
      className={`scroll-mt-6 ${BOARD_SECTION}`}
    >
      <h3 id={headingId} className="text-16 font-semibold">
        Have a room code?
      </h3>
      <form onSubmit={join} className="flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          Room code
        </label>
        <InputOTP
          id={inputId}
          maxLength={ROOM_CODE_LENGTH}
          value={code}
          onChange={(next) => setCode(roomCodeInput(next))}
          pasteTransformer={roomCodeInput}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-describedby={showsHint ? hintId : undefined}
        >
          <InputOTPGroup>
            {CODE_SLOTS.map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className={TYPE_ROOM_CODE}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <button
          type="submit"
          disabled={!isValid || isBusy}
          className={SECONDARY_BUTTON}
        >
          {isBusy ? 'Joining…' : 'Join'}
        </button>
      </form>
      {showsHint ? (
        <p id={hintId} className="text-14 text-fg-muted">
          {ROOM_CODE_HINT}
        </p>
      ) : null}
      <StartError error={error} isBusy={isBusy} />
      <p className="text-14 text-pretty text-fg-muted">
        To host, choose your filters and create a room at the last step.
      </p>
    </section>
  );
};

export default JoinRoom;
