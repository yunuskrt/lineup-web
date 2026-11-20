import React, { type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { TYPE_CARD_TITLE } from '@/styles/classes';

type CardProps = ComponentProps<'div'>;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-4 rounded-md border-2 border-line bg-surface-card py-6 text-fg shadow-hard',
        className,
      )}
      {...props}
    />
  );
};

type CardHeaderProps = ComponentProps<'div'>;

export const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 px-6', className)}
      {...props}
    />
  );
};

type CardTitleProps = ComponentProps<'h3'>;

export const CardTitle = ({ className, ...props }: CardTitleProps) => {
  return (
    <h3
      data-slot="card-title"
      className={cn(TYPE_CARD_TITLE, className)}
      {...props}
    />
  );
};

type CardDescriptionProps = ComponentProps<'p'>;

export const CardDescription = ({
  className,
  ...props
}: CardDescriptionProps) => {
  return (
    <p
      data-slot="card-description"
      className={cn('text-14 text-fg-muted', className)}
      {...props}
    />
  );
};

type CardContentProps = ComponentProps<'div'>;

export const CardContent = ({ className, ...props }: CardContentProps) => {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  );
};

type CardFooterProps = ComponentProps<'div'>;

export const CardFooter = ({ className, ...props }: CardFooterProps) => {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex flex-wrap items-center gap-3 px-6', className)}
      {...props}
    />
  );
};
