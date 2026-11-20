'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { PRIMARY_BUTTON_LARGE, SECONDARY_BUTTON_LARGE } from '@/styles/classes';

export const PROTOCOL_REFUSED_COPY = {
  title: 'Update Lineup to keep playing',
  detail:
    'This version is out of date, so the duel server turned it away. Reload to get the latest version.',
  reload: 'Reload',
  back: 'Back to Play',
} as const;

type Props = {
  // `/play` with the filters kept
  backHref: string;
};

// A page, not a gate: there is no duel to show
const ProtocolRefused = ({ backHref }: Props) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 items-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <RefreshCw />
          </EmptyMedia>
          <EmptyTitle
            ref={headingRef}
            level={1}
            tabIndex={-1}
            className="outline-none"
          >
            {PROTOCOL_REFUSED_COPY.title}
          </EmptyTitle>
          <EmptyDescription>{PROTOCOL_REFUSED_COPY.detail}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <button
            type="button"
            className={PRIMARY_BUTTON_LARGE}
            onClick={() => window.location.reload()}
          >
            {PROTOCOL_REFUSED_COPY.reload}
          </button>
          <Link href={backHref} className={SECONDARY_BUTTON_LARGE}>
            {PROTOCOL_REFUSED_COPY.back}
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  );
};

export default ProtocolRefused;
