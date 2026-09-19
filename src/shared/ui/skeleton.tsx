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

export { Skeleton };
