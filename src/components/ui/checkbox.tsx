'use client';

import React, { type ComponentProps } from 'react';
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS_RING } from '@/styles/classes';

type Props = ComponentProps<typeof CheckboxPrimitive.Root>;

export const Checkbox = ({ className, ...props }: Props) => {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        `peer flex size-5 shrink-0 items-center justify-center rounded-sm border-2 border-line bg-surface-card text-on-accent data-checked:bg-brand data-disabled:cursor-not-allowed data-disabled:opacity-70 ${FOCUS_RING}`,
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator">
        <Check aria-hidden="true" strokeWidth={3} className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
};
