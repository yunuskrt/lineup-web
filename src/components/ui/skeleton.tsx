import React, { type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// Spans in inline layouts take the class itself
export const SKELETON = 'rounded-sm bg-skeleton-fill';

type Props = ComponentProps<'div'>;

export const Skeleton = ({ className, ...props }: Props) => {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(SKELETON, className)}
      {...props}
    />
  );
};
