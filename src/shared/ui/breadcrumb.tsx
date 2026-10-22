import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib';

/**
 * Where an inner page sits, with every level above it one tap away. The last
 * crumb is the page itself and is not a link (`aria-current="page"`).
 */
function Breadcrumb({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <nav aria-label={label} className="min-h-5">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
        {children}
      </ol>
    </nav>
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

function BreadcrumbLink({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      className={cn(
        'hover:text-foreground focus-visible:ring-ring/50 rounded-sm transition-colors duration-300 outline-none focus-visible:ring-[3px]',
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-current="page"
      className={cn('text-foreground max-w-[40ch] truncate font-medium', className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator() {
  return (
    <li aria-hidden className="text-muted-foreground/60 [&>svg]:size-3.5">
      <ChevronRight />
    </li>
  );
}

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
