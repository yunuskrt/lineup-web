import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { TYPE_CARD_TITLE } from '@/styles/classes';

export function Empty({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex w-full min-w-0 flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-line bg-surface p-6 text-center text-balance md:p-12',
        className,
      )}
      {...props}
    />
  );
}

export function EmptyHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn('flex max-w-sm flex-col items-center gap-2', className)}
      {...props}
    />
  );
}

// An icon in an outlined tile, in place of art
export function EmptyMedia({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-media"
      aria-hidden="true"
      className={cn(
        'mb-2 flex size-12 shrink-0 items-center justify-center rounded-md border-2 border-line bg-block-butter text-on-accent shadow-hard-sm [&_svg]:size-6',
        className,
      )}
      {...props}
    />
  );
}

type EmptyTitleProps = ComponentProps<'h2'> & {
  // 1 when the notice is the page itself
  level?: 1 | 2;
};

export function EmptyTitle({
  className,
  level = 2,
  ...props
}: EmptyTitleProps) {
  const Heading = level === 1 ? 'h1' : 'h2';

  return (
    <Heading
      data-slot="empty-title"
      className={cn(TYPE_CARD_TITLE, className)}
      {...props}
    />
  );
}

export function EmptyDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="empty-description"
      className={cn('text-14 text-fg-muted', className)}
      {...props}
    />
  );
}

export function EmptyContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'flex w-full max-w-sm min-w-0 flex-wrap items-center justify-center gap-3',
        className,
      )}
      {...props}
    />
  );
}
