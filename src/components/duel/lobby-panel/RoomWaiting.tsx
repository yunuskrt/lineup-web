'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Link } from 'lucide-react';
import ClosesIn from '@/components/duel/lobby-panel/ClosesIn';
import CopyButton from '@/components/duel/lobby-panel/CopyButton';
import SummaryList from '@/components/duel/lobby-panel/SummaryList';
import { roomLink } from '@/lib/room-code';
import {
  CODE_BOX,
  SECONDARY_BUTTON,
  SECTION_LABEL,
  TYPE_ROOM_CODE,
} from '@/styles/classes';
import type { DuelLobbyView, LobbyAction } from '@/types/duel-lobby';

const COPIED_MS = 2_000;

type CopyTarget = 'code' | 'link';

// "Copied" in place; a refused clipboard says so
function useCopy() {
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [isRefused, setIsRefused] = useState(false);

  useEffect(() => {
    if (copied === null) return;
    const timer = setTimeout(() => setCopied(null), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy(target: CopyTarget, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setIsRefused(false);
      setCopied(target);
    } catch {
      setIsRefused(true);
    }
  }

  return { copied, isRefused, copy };
}

type Props = {
  lobby: Extract<DuelLobbyView, { step: 'roomWaiting' }>;
  onAction: (action: LobbyAction) => void;
};

const RoomWaiting = ({ lobby, onAction }: Props) => {
  const { copied, isRefused, copy } = useCopy();
  const { code } = lobby;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-line bg-surface-card p-4">
        {/* The code below names itself, letter by letter */}
        <span aria-hidden="true" className={SECTION_LABEL}>
          Room code
        </span>
        <p
          aria-label={`Room code ${code.split('').join(' ')}`}
          className="flex w-full max-w-84 justify-center select-all"
        >
          {code.split('').map((char, index) => (
            <span
              key={index}
              className={`aspect-square max-w-14 min-w-0 flex-1 text-20 sm:text-28 ${TYPE_ROOM_CODE} ${CODE_BOX}`}
            >
              {char}
            </span>
          ))}
        </p>
        <div className="grid w-full gap-3 min-[360px]:grid-cols-2">
          <CopyButton
            label="Copy code"
            icon={Copy}
            isCopied={copied === 'code'}
            onCopy={() => void copy('code', code)}
          />
          <CopyButton
            label="Copy link"
            icon={Link}
            isCopied={copied === 'link'}
            onCopy={() =>
              void copy('link', roomLink(window.location.origin, code))
            }
          />
        </div>
      </div>
      <p role="status" className="text-center text-14 text-fg-muted">
        {isRefused
          ? "Copying isn't allowed here. Select the code instead."
          : copied
            ? `${copied === 'code' ? 'Code' : 'Link'} copied.`
            : ''}
      </p>
      <SummaryList summary={lobby.filters} />
      <div className="flex items-center justify-between gap-4">
        <ClosesIn expiresAt={lobby.expiresAt} />
        <button
          type="button"
          className={SECONDARY_BUTTON}
          onClick={() => onAction('cancel')}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RoomWaiting;
