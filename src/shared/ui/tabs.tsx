'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        'group/tabs flex gap-2 data-[orientation=horizontal]:flex-col',
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent',
      },
      scrollable: {
        true: 'scroll-fade-x scrollbar-none max-w-full justify-start overflow-x-auto overscroll-x-contain *:data-[slot=tabs-trigger]:flex-none',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      scrollable: false,
    },
  },
);

const FADE_WIDTH = 24;

function revealActiveTrigger(list: HTMLElement) {
  const active = list.querySelector('[data-slot="tabs-trigger"][data-state="active"]');
  if (!active) return;

  const bounds = list.getBoundingClientRect();
  const item = active.getBoundingClientRect();
  if (item.left < bounds.left + FADE_WIDTH) {
    list.scrollLeft += item.left - bounds.left - FADE_WIDTH;
  } else if (item.right > bounds.right - FADE_WIDTH) {
    list.scrollLeft += item.right - bounds.right + FADE_WIDTH;
  }
}

/**
 * Local deviation from upstream shadcn: the `scrollable` variant, for a list
 * that may be wider than a phone. It scrolls sideways without a scrollbar
 * (one would steal height from the fixed-height pill and squash the tabs),
 * keeps every tab at its natural width, fades the edge that has more behind
 * it, and keeps the selected tab in view.
 */
function TabsList({
  className,
  variant = 'default',
  scrollable = false,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const attach = React.useCallback(
    (list: HTMLDivElement | null) => {
      if (typeof ref === 'function') ref(list);
      else if (ref) ref.current = list;
      if (!list || !scrollable) return;

      revealActiveTrigger(list);
      const observer = new MutationObserver(() => {
        revealActiveTrigger(list);
      });
      observer.observe(list, { subtree: true, attributeFilter: ['data-state'] });
      return () => {
        observer.disconnect();
        if (typeof ref === 'function') ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref, scrollable],
  );

  return (
    <TabsPrimitive.List
      ref={attach}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant, scrollable }), className)}
      {...props}
    />
  );
}

/**
 * One local deviation from upstream shadcn. Keep it when re-running
 * `shadcn add tabs --overwrite`.
 *
 * The underline `::after` is only for the `line` variant, so the `default`
 * variant does not render it at all. Hidden by opacity alone it still sits
 * 5px below the trigger, and a list that scrolls sideways (`overflow-x-auto`)
 * then scrolls vertically too and shows a scrollbar.
 */
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "text-foreground/60 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
        'data-[state=active]:bg-card data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground',
        'after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=default]/tabs-list:after:hidden group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('animate-fade flex-1 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
