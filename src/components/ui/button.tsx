import React, { type ComponentProps } from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/styles/classes';

type Props = ComponentProps<typeof ButtonPrimitive> &
  VariantProps<typeof buttonVariants>;

export const Button = ({ className, variant, size, ...props }: Props) => {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        buttonVariants({ variant, size }),
        className,
      )}
      {...props}
    />
  );
};
