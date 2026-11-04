import * as React from 'react';

import { cn } from '@/shared/lib';

/**
 * A native radio button or checkbox with its label, sized as a touch target.
 * Native rather than Radix for the reason `select.tsx` gives: the platform
 * already implements the arrow keys, the grouping by `name` and the form state.
 */
function Choice({
  className,
  children,
  type = 'radio',
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'> & { type?: 'radio' | 'checkbox' }) {
  return (
    <label
      data-slot="choice"
      className={cn(
        'has-[:checked]:border-primary has-[:focus-visible]:ring-ring/50 hover:bg-accent/50 flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:ring-[3px]',
        className,
      )}
    >
      <input
        type={type}
        className="accent-primary size-4 shrink-0 outline-none"
        {...props}
      />
      <span className="min-w-0 break-words">{children}</span>
    </label>
  );
}

export { Choice };
