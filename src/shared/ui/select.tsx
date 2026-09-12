import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/shared/lib';

interface SelectProps extends Omit<
  React.ComponentProps<'select'>,
  'onChange' | 'value' | 'size'
> {
  value?: string;
  onValueChange?: (value: string) => void;
  uiSize?: 'sm' | 'default';
}

/**
 * A native `<select>` rather than a Radix primitive: the latter pulled in
 * floating-ui, focus-scope, dismissable-layer and the collection helpers for
 * a control the platform already implements. See the `pnpm size` budget note
 * this swap resolved.
 */
function Select({
  className,
  value,
  onValueChange,
  uiSize = 'default',
  ...props
}: SelectProps) {
  return (
    <div className="relative inline-block w-fit">
      <select
        data-slot="select"
        data-size={uiSize}
        value={value}
        onChange={event => onValueChange?.(event.target.value)}
        className={cn(
          'border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 flex w-full min-w-0 appearance-none items-center rounded-md border bg-transparent px-3 py-1 pr-8 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8',
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 opacity-50"
      />
    </div>
  );
}

function SelectItem({ ...props }: React.ComponentProps<'option'>) {
  return <option data-slot="select-item" {...props} />;
}

export { Select, SelectItem };
