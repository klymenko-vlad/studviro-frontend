import type { ReactNode } from 'react';

import { cn } from '@/shared/lib';

/**
 * Four content widths, named for what they hold rather than for a number, so
 * the choice is a decision instead of whichever `max-w-*` the last page used.
 */
const WIDTHS = {
  form: 'max-w-lg',
  prose: 'max-w-3xl',
  detail: 'max-w-5xl',
  index: 'max-w-6xl',
} as const;

/**
 * The page frame every signed-in screen renders into: the `main` landmark the
 * skip link targets, one of four content widths, and the vertical rhythm
 * between the header and the sections under it.
 */
export function PageShell({
  width = 'index',
  className,
  children,
}: {
  width?: keyof typeof WIDTHS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main
      id="main-content"
      className={cn(
        'animate-rise mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-12',
        WIDTHS[width],
        className,
      )}
    >
      {children}
    </main>
  );
}

/**
 * The single `h1` of the page, its explanation, and the actions that belong to
 * the page as a whole rather than to one section of it. `type-title` carries
 * the tracking and leading for this step of the scale; no caller sets them.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-2">
      {eyebrow === undefined ? null : (
        <p className="text-muted-foreground type-eyebrow">{eyebrow}</p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="type-title">{title}</h1>
        {actions === undefined ? null : (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {description === undefined ? null : (
        <p className="text-muted-foreground max-w-2xl text-pretty">{description}</p>
      )}

      {children}
    </header>
  );
}
