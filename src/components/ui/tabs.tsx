'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { FOCUS_RING } from '@/styles/classes';

export function Tabs({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  );
}

// The segmented control: options in one pill
export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
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
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Tab>) {
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
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(`rounded-sm ${FOCUS_RING}`, className)}
      {...props}
    />
  );
}
