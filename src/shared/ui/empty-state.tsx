import type { ReactNode } from 'react';

import { cn } from '@/shared/lib';

/**
 * Nothing here, said as a state rather than as an apology. The part that most
 * often matters is `action`: an empty list that knows how to stop being empty
 * should offer the way, not just report the fact.
 *
 * `size="inline"` is the version that sits inside a card section, where the
 * surrounding `CardTitle` already says what is missing.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'default',
  className,
  ...rest
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  size?: 'default' | 'inline';
  className?: string;
} & { 'data-testid'?: string }) {
  const inline = size === 'inline';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center',
        inline ? 'py-6' : 'py-12',
        className,
      )}
      {...rest}
    >
      {icon === undefined ? null : (
        <div
          aria-hidden
          className={cn(
            'bg-muted text-muted-foreground animate-fade grid place-items-center rounded-xl [&_svg]:size-1/2',
            inline ? 'size-9' : 'size-12',
          )}
        >
          {icon}
        </div>
      )}

      <p className={cn('font-medium', inline ? 'text-sm' : 'type-section')}>{title}</p>

      {description === undefined ? null : (
        <p className="text-muted-foreground max-w-sm text-sm text-pretty">
          {description}
        </p>
      )}

      {action === undefined ? null : <div className="mt-2">{action}</div>}
    </div>
  );
}
