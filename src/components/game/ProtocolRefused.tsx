'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { PRIMARY_BUTTON_LARGE, TEXT_LINK } from '@/styles/classes';

export const PROTOCOL_REFUSED_COPY = {
  title: 'Update Lineup to keep playing',
  detail:
    'This version is out of date, so the duel server turned it away. Reload to get the latest version.',
  reload: 'Reload',
  back: 'Back to Play',
} as const;

type ProtocolRefusedProps = {
  // `/play` with the filters kept
  backHref: string;
};

// A page, not a gate: there is no duel to show
export function ProtocolRefused({ backHref }: ProtocolRefusedProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 items-center">
      <div className="flex max-w-xl flex-col items-start gap-6">
        <div className="flex flex-col gap-3">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-32 leading-tight font-bold text-balance font-stretch-expanded outline-none sm:text-48"
          >
            {PROTOCOL_REFUSED_COPY.title}
          </h1>
          <p className="text-16 leading-6 text-fg-muted">
            {PROTOCOL_REFUSED_COPY.detail}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            className={PRIMARY_BUTTON_LARGE}
            onClick={() => window.location.reload()}
          >
            {PROTOCOL_REFUSED_COPY.reload}
          </button>
          <Link href={backHref} className={`text-14 ${TEXT_LINK}`}>
            {PROTOCOL_REFUSED_COPY.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
