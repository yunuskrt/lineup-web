import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

export type StateNoticeTone = 'error' | 'empty' | 'info';

const TILE: Record<StateNoticeTone, string> = {
  error: 'bg-block-coral',
  empty: 'bg-block-butter',
  info: 'bg-block-mint',
};

type Props = {
  tone: StateNoticeTone;
  icon: LucideIcon;
  message: ReactNode;
  title?: string;
  titleLevel?: 1 | 2 | 3;
  // Inline under a list: smaller box and tile
  isCompact?: boolean;
  children?: ReactNode;
};

// Empty and error states: icon tile, words, action
const StateNotice = ({
  tone,
  icon: Icon,
  message,
  title,
  titleLevel,
  isCompact = false,
  children,
}: Props) => {
  const isAlert = tone === 'error';

  return (
    <Empty className={cn(isCompact && 'gap-3 p-4 md:p-6')}>
      <EmptyHeader>
        <EmptyMedia className={cn(TILE[tone], isCompact && 'size-10')}>
          <Icon />
        </EmptyMedia>
        {title ? <EmptyTitle level={titleLevel}>{title}</EmptyTitle> : null}
        <EmptyDescription
          role={isAlert ? 'alert' : undefined}
          className={cn(!title && 'text-16 leading-6 text-fg')}
        >
          {message}
        </EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  );
};

export default StateNotice;
