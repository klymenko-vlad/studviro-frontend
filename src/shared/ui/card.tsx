import * as React from 'react';

import { cn } from '@/shared/lib';

/**
 * Local deviation from upstream shadcn, kept on re-generation: `interactive`
 * marks a card whose whole surface goes somewhere. Put a `stretched-link` on
 * the one link inside it, and `relative z-10` on any other control so it stays
 * clickable above the link.
 */
function Card({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<'div'> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground relative flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        interactive && 'card-interactive',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Local deviation from upstream shadcn, kept on re-generation: a card title is
 * a section heading, so it renders as one (WCAG 1.3.1). `h2` is the default
 * because most cards sit directly under the page `h1`; pass `as="h3"` for a
 * card nested inside a section that already has an `h2`, so the outline never
 * skips a level.
 */
function CardTitle({
  className,
  as: Comp = 'h2',
  ...props
}: React.ComponentProps<'h2'> & { as?: 'h2' | 'h3' | 'h4' }) {
  return (
    <Comp
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
