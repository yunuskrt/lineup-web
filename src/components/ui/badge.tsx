import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { TYPE_STICKER } from '@/styles/classes';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 border-2 border-line whitespace-nowrap text-on-accent [&>svg]:pointer-events-none [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        tag: 'rounded-full px-2.5 py-0.5 text-12 font-medium',
        // Tilted label, as moodboard/brutal-02
        sticker: `rounded-sm px-2 py-0.5 shadow-hard-sm ${TYPE_STICKER}`,
      },
      tone: {
        neutral: 'bg-surface-card',
        green: 'bg-tag-green',
        amber: 'bg-tag-amber',
        red: 'bg-tag-red',
        blue: 'bg-tag-blue',
        purple: 'bg-tag-purple',
        yellow: 'bg-tag-yellow',
        grey: 'bg-tag-grey',
        brand: 'bg-brand',
        you: 'bg-you',
        opponent: 'bg-opponent',
        found: 'bg-found',
        warning: 'bg-warning',
        mint: 'bg-block-mint',
        butter: 'bg-block-butter',
        coral: 'bg-block-coral',
      },
      tilt: {
        none: '',
        left: '-rotate-3',
        right: 'rotate-2',
      },
    },
    defaultVariants: { variant: 'tag', tone: 'neutral', tilt: 'none' },
  },
);

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({
  className,
  variant,
  tone,
  tilt,
  ...props
}: BadgeProps) {
  const lean = tilt ?? (variant === 'sticker' ? 'left' : 'none');

  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone, tilt: lean }), className)}
      {...props}
    />
  );
}
