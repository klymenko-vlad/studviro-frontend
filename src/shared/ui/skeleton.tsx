import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib';

/**
 * Local deviation from upstream shadcn, kept on re-generation: the placeholder
 * is a named live region rather than a silent box, so a screen-reader user is
 * told the screen is still loading instead of hearing nothing (WCAG 4.1.3).
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  const t = useTranslations('common');

  return (
    <div
      data-slot="skeleton"
      role="status"
      aria-label={t('loading')}
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

/** One `role="status"` for the group; the bars inside it are decoration. */
function SkeletonGroup({ className, ...props }: React.ComponentProps<'div'>) {
  const t = useTranslations('common');

  return (
    <div
      data-slot="skeleton-group"
      role="status"
      aria-label={t('loading')}
      className={cn('flex w-full flex-col', className)}
      {...props}
    />
  );
}

function Bar({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('bg-accent animate-pulse rounded-md', className)} />
  );
}

/**
 * A placeholder shaped like the table it stands in for, so the page does not
 * jump when the rows arrive. A single `h-24` rectangle resolving into six rows
 * moves everything below it.
 */
function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  ...props
}: { rows?: number; columns?: number } & React.ComponentProps<'div'>) {
  return (
    <SkeletonGroup className={cn('gap-2', className)} {...props}>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, column) => (
          <Bar key={column} className="h-4" />
        ))}
      </div>

      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="grid gap-3 border-t pt-2"
          style={{ gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, column) => (
            <Bar key={column} className="h-4 opacity-70" />
          ))}
        </div>
      ))}
    </SkeletonGroup>
  );
}

/** The placeholder for a stack of cards — `ListingCard`, a dashboard tile. */
function ListSkeleton({
  items = 3,
  className,
  ...props
}: { items?: number } & React.ComponentProps<'div'>) {
  return (
    <SkeletonGroup className={cn('gap-3', className)} {...props}>
      {Array.from({ length: items }, (_, item) => (
        <div key={item} className="flex flex-col gap-2 rounded-xl border p-4">
          <Bar className="h-4 w-1/3" />
          <Bar className="h-3 w-1/5 opacity-70" />
          <Bar className="h-3 w-2/3 opacity-70" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

export { Skeleton, TableSkeleton, ListSkeleton };
