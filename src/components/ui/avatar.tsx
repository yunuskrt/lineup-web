'use client';

import React, { type ComponentProps } from 'react';
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full border-2 border-line',
  {
    variants: {
      size: {
        sm: 'size-8 text-12',
        default: 'size-10 text-14',
        lg: 'size-12 text-16',
      },
      // Fill behind initials; a duel marks the finder
      tone: {
        neutral: 'bg-surface-sage',
        you: 'bg-you',
        opponent: 'bg-opponent',
      },
    },
    defaultVariants: { size: 'default', tone: 'neutral' },
  },
);

type AvatarProps = ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>;

export const Avatar = ({ className, size, tone, ...props }: AvatarProps) => {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size, tone }), className)}
      {...props}
    />
  );
};

type AvatarImageProps = ComponentProps<typeof AvatarPrimitive.Image>;

export const AvatarImage = ({ className, ...props }: AvatarImageProps) => {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  );
};

type AvatarFallbackProps = ComponentProps<typeof AvatarPrimitive.Fallback>;

export const AvatarFallback = ({
  className,
  ...props
}: AvatarFallbackProps) => {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center font-bold text-on-accent',
        className,
      )}
      {...props}
    />
  );
};
