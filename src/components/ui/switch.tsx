'use client';

import React, { type ComponentProps } from 'react';
import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from '@/lib/utils';
import { FOCUS_RING } from '@/styles/classes';

type Props = ComponentProps<typeof SwitchPrimitive.Root>;

export const Switch = ({ className, ...props }: Props) => {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        `peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-line bg-surface-card data-checked:bg-brand data-disabled:cursor-not-allowed data-disabled:opacity-70 ${FOCUS_RING}`,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 translate-x-0.5 rounded-full border-2 border-line bg-surface-card transition-transform data-checked:translate-x-5.5 motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  );
};
