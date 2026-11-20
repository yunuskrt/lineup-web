'use client';

import React, { type ComponentProps } from 'react';
import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SELECT_TRIGGER } from '@/styles/classes';

// neobrutalism.dev Select on Base UI, in our roles
export const Select = SelectPrimitive.Root;

type SelectLabelProps = ComponentProps<typeof SelectPrimitive.Label>;

export const SelectLabel = ({ className, ...props }: SelectLabelProps) => {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('cursor-default', className)}
      {...props}
    />
  );
};

type SelectValueProps = ComponentProps<typeof SelectPrimitive.Value>;

export const SelectValue = ({ className, ...props }: SelectValueProps) => {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn('flex-1 text-left', className)}
      {...props}
    />
  );
};

type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger>;

export const SelectTrigger = ({
  className,
  children,
  ...props
}: SelectTriggerProps) => {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(SELECT_TRIGGER, className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="flex">
        <ChevronDown aria-hidden="true" className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
};

type SelectContentProps = ComponentProps<typeof SelectPrimitive.Popup>;

export const SelectContent = ({
  className,
  children,
  ...props
}: SelectContentProps) => {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={6}
        alignItemWithTrigger={false}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            'max-h-[min(20rem,var(--available-height))] min-w-(--anchor-width) overflow-y-auto rounded-md border-2 border-line bg-surface-card text-fg shadow-hard outline-none',
            className,
          )}
          {...props}
        >
          <SelectPrimitive.List data-slot="select-list" className="p-1">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
};

type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item>;

export const SelectItem = ({
  className,
  children,
  ...props
}: SelectItemProps) => {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex cursor-default items-center rounded-sm border-2 border-transparent py-1.5 pr-8 pl-2 text-14 tabular-nums outline-none select-none data-highlighted:border-line data-highlighted:bg-brand data-highlighted:text-on-accent data-disabled:opacity-70',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText
        data-slot="select-item-text"
        className="whitespace-nowrap"
      >
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        data-slot="select-item-indicator"
        className="absolute right-2 flex items-center"
      >
        <Check aria-hidden="true" strokeWidth={3} className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
};
