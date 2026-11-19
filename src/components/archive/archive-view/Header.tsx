'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useAppConfig } from '@/hooks/use-pro';
import { archiveTotalLine } from '@/lib/archive';
import { showsPro } from '@/lib/pro';
import { cn } from '@/lib/utils';
import { BOARD_SECTION, TYPE_TITLE } from '@/styles/classes';
import type { ArchiveView as ArchiveViewModel } from '@/types/archive';
import { SKELETON } from '@/components/ui/skeleton';

const LOCKED_LINE =
  'Every match in the game, searchable. Pick one and play it.';

const LINE = 'text-16 leading-6 text-fg-muted';

type Props = { view: ArchiveViewModel };

const Header = ({ view }: Props) => {
  const isLocked = view.status === 'locked';
  const config = useAppConfig();

  return (
    <header className={cn(BOARD_SECTION, 'gap-2')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className={TYPE_TITLE}>Archive</h1>
        {/* No word "Pro" while the split is off */}
        {showsPro(config.data ?? null) ? (
          <Badge variant="sticker" tone="brand">
            Pro
          </Badge>
        ) : null}
      </div>
      {isLocked ? (
        <p className={LINE}>{LOCKED_LINE}</p>
      ) : view.total !== null ? (
        <p aria-live="polite" className={LINE}>
          {archiveTotalLine(view.total)}
        </p>
      ) : (
        // The line's own height while the total loads
        <div aria-hidden="true" className="flex h-6 items-center">
          <span className={`h-4 w-full max-w-md ${SKELETON}`} />
        </div>
      )}
    </header>
  );
};

export default Header;
