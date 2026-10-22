import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn, toneStyle } from '@/shared/lib';

/**
 * One place in a short list — a course on the dashboard, a search result, what
 * is up next — clickable across its whole width. Pass the app's `Link` as the
 * child with `asChild`.
 */
function LinkRow({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      className={cn(
        'group hover:bg-secondary/70 focus-visible:ring-ring/50 flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-300 outline-none focus-visible:ring-[3px]',
        className,
      )}
      {...props}
    />
  );
}

/** The row's way in, nudging forward as the pointer arrives. */
function LinkRowChevron() {
  return (
    <ChevronRight
      aria-hidden
      className="text-muted-foreground size-4 shrink-0 transition-transform duration-500 ease-(--ease-premium) group-hover:translate-x-0.5 motion-reduce:transition-none"
    />
  );
}

/** A course's colour as a dot, keyed by its code. */
function ToneDot({ code }: { code: string }) {
  return (
    <span
      aria-hidden
      style={toneStyle(code)}
      className="tone bg-tone size-2 shrink-0 rounded-full"
    />
  );
}

export { LinkRow, LinkRowChevron, ToneDot };
