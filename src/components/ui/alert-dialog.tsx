'use client';

import React, { type ComponentProps } from 'react';
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { cn } from '@/lib/utils';

export const AlertDialog = AlertDialogPrimitive.Root;

export const AlertDialogClose = AlertDialogPrimitive.Close;

type AlertDialogContentProps = ComponentProps<
  typeof AlertDialogPrimitive.Popup
>;

export const AlertDialogContent = ({
  className,
  ...props
}: AlertDialogContentProps) => {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        data-slot="alert-dialog-overlay"
        className="fixed inset-0 z-50 bg-gate-scrim"
      />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-md border-2 border-line bg-surface-card p-6 text-fg shadow-hard outline-none',
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
};

type AlertDialogTitleProps = ComponentProps<typeof AlertDialogPrimitive.Title>;

export const AlertDialogTitle = ({
  className,
  ...props
}: AlertDialogTitleProps) => {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-20 font-semibold', className)}
      {...props}
    />
  );
};

type AlertDialogDescriptionProps = ComponentProps<
  typeof AlertDialogPrimitive.Description
>;

export const AlertDialogDescription = ({
  className,
  ...props
}: AlertDialogDescriptionProps) => {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-14 text-fg-muted', className)}
      {...props}
    />
  );
};

type AlertDialogFooterProps = ComponentProps<'div'>;

export const AlertDialogFooter = ({
  className,
  ...props
}: AlertDialogFooterProps) => {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('mt-4 flex flex-wrap gap-3', className)}
      {...props}
    />
  );
};
