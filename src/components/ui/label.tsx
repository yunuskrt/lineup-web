import React, { type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentProps<'label'>;

export const Label = ({ className, ...props }: Props) => {
  return (
    <label
      data-slot="label"
      className={cn(
        'text-14 leading-5 font-semibold text-fg peer-disabled:cursor-not-allowed peer-disabled:opacity-70 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
};
