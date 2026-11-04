import type { ReactNode } from 'react';

import { cn } from '@/shared/lib';

import { Card, CardContent } from './card';

/**
 * The shape both `/enroll` and `/exams` render: a thing on offer, its code, a
 * row of badges, some muted notes explaining where the caller stands with it,
 * and an action.
 *
 * Not a generic primitive — it is one recurring composition of `Card`, kept
 * here because two entity slices need it and an entity may not import another.
 * Everything domain-specific stays in the caller; this owns the frame.
 *
 * Laid out in a grid, cards in a row take the height of the tallest, and the
 * action sits at the foot so the buttons line up whatever the notes above say.
 */
export function ListingCard({
  title,
  headingLevel: Heading = 'h3',
  code,
  badges,
  header,
  action,
  dimmed = false,
  interactive = false,
  children,
}: {
  title: ReactNode;
  /**
   * `h3` suits a card inside a section that already has an `h2`, which is where
   * most of these live. A list rendered straight under the page `h1` passes
   * `h2`, so the outline never skips a level.
   */
  headingLevel?: 'h2' | 'h3';
  code?: ReactNode;
  badges?: ReactNode;
  /** Rendered above the title — the exam cards put the sitting's date there. */
  header?: ReactNode;
  action?: ReactNode;
  dimmed?: boolean;
  /** The title holds a `stretched-link`, so the whole card follows it. */
  interactive?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card interactive={interactive} className={cn('h-full py-1', dimmed && 'opacity-70')}>
      <CardContent className="flex flex-1 flex-col gap-2 py-4">
        {header}

        <Heading className="text-base leading-tight font-semibold">{title}</Heading>

        {code === undefined ? null : (
          <p className="text-muted-foreground font-mono text-xs">{code}</p>
        )}

        {badges === undefined ? null : (
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
        )}

        {children}

        {action === undefined ? null : (
          <div className="relative z-10 mt-auto flex justify-end pt-2">{action}</div>
        )}
      </CardContent>
    </Card>
  );
}

/** A muted line under the badges saying where the caller stands. */
export function ListingNote({
  children,
  ...rest
}: { children: ReactNode } & { 'data-testid'?: string }) {
  return (
    <p className="text-muted-foreground text-sm" {...rest}>
      {children}
    </p>
  );
}
