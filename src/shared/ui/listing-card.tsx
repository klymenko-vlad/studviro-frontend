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
 */
export function ListingCard({
  title,
  code,
  badges,
  header,
  action,
  dimmed = false,
  children,
}: {
  title: ReactNode;
  code?: ReactNode;
  badges?: ReactNode;
  /** Rendered above the title — the exam cards put the sitting's date there. */
  header?: ReactNode;
  action?: ReactNode;
  dimmed?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card className={cn(dimmed && 'opacity-70')}>
      <CardContent className="flex flex-col gap-2 py-4">
        {header}

        <h3 className="text-base leading-tight font-semibold">{title}</h3>

        {code === undefined ? null : (
          <p className="text-muted-foreground font-mono text-xs">{code}</p>
        )}

        {badges === undefined ? null : (
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
        )}

        {children}

        {action === undefined ? null : <div className="flex justify-end">{action}</div>}
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
