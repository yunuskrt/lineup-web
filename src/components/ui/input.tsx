import React, { type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { TEXT_INPUT } from '@/styles/classes';

type Props = ComponentProps<'input'>;

export const Input = ({ className, ...props }: Props) => {
  return (
    <input data-slot="input" className={cn(TEXT_INPUT, className)} {...props} />
  );
};
