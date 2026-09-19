import { cn } from '@/shared/lib';

/**
 * Three ascending bars — a term stacking into a record, which is what the
 * platform is for. Drawn in `currentColor` except the leading bar, which takes
 * the primary token, so the mark follows the theme and a rebrand stays a change
 * to `globals.css` rather than an asset swap.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-6 shrink-0', className)}>
      <rect x="3" y="14" width="5" height="7" rx="2" fill="currentColor" opacity="0.35" />
      <rect
        x="9.5"
        y="9"
        width="5"
        height="12"
        rx="2"
        fill="currentColor"
        opacity="0.6"
      />
      <rect x="16" y="3" width="5" height="18" rx="2" fill="var(--primary)" />
    </svg>
  );
}

export function Logo({
  variant = 'full',
  className,
}: {
  variant?: 'full' | 'mark';
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      {variant === 'mark' ? null : (
        <span
          translate="no"
          className="text-[1.0625rem] leading-none font-semibold tracking-tight"
        >
          Stud<span className="text-primary">V</span>iro
        </span>
      )}
    </span>
  );
}
