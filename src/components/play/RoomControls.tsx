'use client';

import { useRouter } from 'next/navigation';
import { type SubmitEvent, useId, useState, useTransition } from 'react';
import { useEnsureSession } from '@/hooks/use-auth';
import { authErrorMessageOf } from '@/lib/auth';
import { withQuery } from '@/lib/filters';
import {
  CREATE_ROOM,
  hasLookAlike,
  isRoomCode,
  ROOM_CODE_HINT,
  roomCodeInput,
  withRoom,
} from '@/lib/room-code';
import { FOCUS_RING, SECONDARY_BUTTON } from '@/styles/classes';

type RoomControlsProps = {
  // Null while the filters load
  filterParams: URLSearchParams | null;
  initialCode: string;
};

type Pending = 'create' | 'join';

export function RoomControls({ filterParams, initialCode }: RoomControlsProps) {
  const router = useRouter();
  const ensureSession = useEnsureSession();
  const [isNavigating, startNavigation] = useTransition();
  const [code, setCode] = useState(() => roomCodeInput(initialCode));
  const [pending, setPending] = useState<Pending | null>(null);
  const headingId = useId();
  const inputId = useId();
  const hintId = useId();
  const isBusy = ensureSession.isPending || isNavigating;
  const isValid = isRoomCode(code);
  const showsHint = hasLookAlike(code);

  // A guest is made first, as Start does
  async function go(kind: Pending, params: URLSearchParams) {
    setPending(kind);
    try {
      await ensureSession.mutateAsync();
      startNavigation(() => router.push(withQuery('/play/duel', params)));
    } catch {
      // Shown through ensureSession.error
    }
  }

  function create() {
    if (filterParams) void go('create', withRoom(filterParams, CREATE_ROOM));
  }

  function join(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    void go('join', withRoom(filterParams ?? new URLSearchParams(), code));
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 border-t border-line pt-6"
    >
      <h3 id={headingId} className="text-16 font-semibold">
        Play a friend
      </h3>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={create}
          disabled={!filterParams || isBusy}
          className={SECONDARY_BUTTON}
        >
          {pending === 'create' && isBusy ? 'Creating…' : 'Create room'}
        </button>
        <span aria-hidden="true" className="text-14 text-fg-muted">
          or
        </span>
        <form onSubmit={join} className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Room code
          </label>
          <input
            id={inputId}
            type="text"
            value={code}
            onChange={(event) => setCode(roomCodeInput(event.target.value))}
            placeholder="Room code"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-describedby={showsHint ? hintId : undefined}
            className={`w-36 rounded-sm border border-line bg-surface-card px-3 py-2 text-16 font-semibold tracking-widest tabular-nums placeholder:font-normal placeholder:tracking-normal placeholder:text-fg-dim ${FOCUS_RING}`}
          />
          <button
            type="submit"
            disabled={!isValid || isBusy}
            className={SECONDARY_BUTTON}
          >
            {pending === 'join' && isBusy ? 'Joining…' : 'Join'}
          </button>
        </form>
      </div>
      {showsHint ? (
        <p id={hintId} className="text-14 text-fg-muted">
          {ROOM_CODE_HINT}
        </p>
      ) : null}
      {ensureSession.error && !isBusy ? (
        <p role="alert" className="text-14 text-danger">
          {authErrorMessageOf(ensureSession.error)}
        </p>
      ) : null}
    </section>
  );
}
