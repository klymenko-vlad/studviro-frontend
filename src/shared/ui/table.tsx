'use client';

import * as React from 'react';

import { cn } from '@/shared/lib';

/**
 * Local deviation from upstream shadcn, kept on re-generation.
 *
 * `label` is required and does two jobs: it is the table's `<caption>`, and it
 * names the scroll container. The container is also `tabIndex={0}` with
 * `role="region"` — a region that scrolls has to be reachable by keyboard
 * (WCAG 2.1.1), and a focusable region needs an accessible name (4.1.2).
 * It is focusable at every width rather than only when it overflows, which
 * would need a measurement in render; the cost is one extra tab stop per table.
 *
 * In a narrow container the table stacks: each row becomes a block, the cell
 * without a `label` is its title, and every labelled cell shows its column
 * name above the value (`table-stack` in `globals.css`). A `wide` cell, such
 * as one holding a form, takes the full width instead of half. It is a container
 * query, so a table in a narrow card stacks on a wide screen too. Wider than
 * that, a table that still does not fit scrolls, with `scroll-affordance-x`
 * as the cue.
 *
 * `tabular-nums` is on the table rather than on each numeric column: in a
 * grid of credits, capacities and counts, proportional digits do not line up
 * between rows, and remembering the utility per column is how that gets
 * missed. Short text labels are unharmed by lining figures.
 */
function Table({
  className,
  label,
  children,
  ...props
}: React.ComponentProps<'table'> & { label: string }) {
  return (
    <div
      data-slot="table-container"
      role="region"
      aria-label={label}
      tabIndex={0}
      className="table-stack scroll-affordance-x focus-visible:ring-ring/50 relative w-full overflow-x-auto rounded-md focus-visible:ring-[3px] focus-visible:outline-none"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm tabular-nums', className)}
        {...props}
      >
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  label,
  wide = false,
  ...props
}: React.ComponentProps<'td'> & { label?: string; wide?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      data-label={label}
      data-wide={wide || undefined}
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
