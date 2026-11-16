import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// neobrutalism.dev Alert; no live role, callers add one
const alertVariants = cva(
  'grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-md border-2 border-line px-4 py-3 text-left text-14 text-on-accent shadow-hard-sm has-[>svg]:grid-cols-[1rem_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5',
  {
    variants: {
      tone: {
        warning: 'bg-warning',
        neutral: 'bg-surface-card text-fg',
      },
    },
    defaultVariants: { tone: 'warning' },
  },
);

type AlertProps = ComponentProps<'div'> & VariantProps<typeof alertVariants>;

export function Alert({ className, tone, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('col-start-2 text-pretty', className)}
      {...props}
    />
  );
}
