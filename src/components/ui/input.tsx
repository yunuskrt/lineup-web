import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { TEXT_INPUT } from '@/styles/classes';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input data-slot="input" className={cn(TEXT_INPUT, className)} {...props} />
  );
}
