'use client';

import { useId } from 'react';
import { ProLockButton, ProLockCaption } from '@/components/pro/ProLock';
import { useProAccess } from '@/hooks/use-pro';
import StartError from '@/components/play/StartError';
import { useStartNavigation } from '@/hooks/use-start-navigation';
import { withQuery } from '@/lib/filters';
import { CREATE_ROOM, withRoom } from '@/lib/room-code';
import {
  BOARD_SECTION,
  SECONDARY_BUTTON,
  SECTION_LABEL,
} from '@/styles/classes';

type CreateRoomProps = {
  // Null while the filters load
  filterParams: URLSearchParams | null;
};

export function CreateRoom({ filterParams }: CreateRoomProps) {
  const { go, isBusy, error } = useStartNavigation();
  // Hosting is Pro (R10); joining is for anyone
  const hostAccess = useProAccess();
  const headingId = useId();
  const lockId = useId();

  function create() {
    if (!filterParams) return;
    void go(withQuery('/play/duel', withRoom(filterParams, CREATE_ROOM)));
  }

  return (
    <section aria-labelledby={headingId} className={BOARD_SECTION}>
      <h3 id={headingId} className={SECTION_LABEL}>
        Play a friend
      </h3>
      <div className="flex flex-col items-start gap-3">
        {hostAccess === 'open' ? (
          <button
            type="button"
            onClick={create}
            disabled={!filterParams || isBusy}
            className={SECONDARY_BUTTON}
          >
            {isBusy ? 'Creating…' : 'Create room'}
          </button>
        ) : (
          <ProLockButton
            label="Create room"
            captionId={hostAccess === 'locked' ? lockId : undefined}
          />
        )}
        {hostAccess === 'locked' ? (
          <ProLockCaption
            id={lockId}
            caption="Pro hosts rooms. Anyone can join."
          />
        ) : null}
        <StartError error={error} isBusy={isBusy} />
      </div>
    </section>
  );
}
