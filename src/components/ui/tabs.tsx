'use client';

import React, { type ComponentProps } from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';
import { FOCUS_RING } from '@/styles/classes';

type TabsProps = ComponentProps<typeof TabsPrimitive.Root>;

export const Tabs = ({ className, ...props }: TabsProps) => {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  );
};

type TabsListProps = ComponentProps<typeof TabsPrimitive.List>;

// The segmented control: options in one pill
export const TabsList = ({ className, ...props }: TabsListProps) => {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-md border-2 border-line bg-surface-card p-1',
        className,
      )}
      {...props}
    />
  );
};

type TabsTriggerProps = ComponentProps<typeof TabsPrimitive.Tab>;

export const TabsTrigger = ({ className, ...props }: TabsTriggerProps) => {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        `inline-flex items-center justify-center gap-1.5 rounded-sm border-2 border-transparent px-3 py-1 text-14 font-semibold whitespace-nowrap text-fg-muted hover:text-fg data-active:border-line data-active:bg-brand data-active:text-on-accent data-disabled:cursor-not-allowed data-disabled:opacity-70 [&_svg]:size-4 [&_svg]:shrink-0 ${FOCUS_RING}`,
        className,
      )}
      {...props}
    />
  );
};

type TabsContentProps = ComponentProps<typeof TabsPrimitive.Panel>;

export const TabsContent = ({ className, ...props }: TabsContentProps) => {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(`rounded-sm ${FOCUS_RING}`, className)}
      {...props}
    />
  );
};
