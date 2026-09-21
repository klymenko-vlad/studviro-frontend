import type { ReactNode } from 'react';

import { cn } from '@/shared/lib';

interface MarketingSectionProps {
  title?: string;
  subtitle?: string;
  headingLevel?: 'h1' | 'h2';
  muted?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * The band every marketing section sits in: one width, one rhythm, one place
 * to change either. Sections differ in what they contain, never in how far
 * from the edge of the screen they start.
 */
export function MarketingSection({
  title,
  subtitle,
  headingLevel: Heading = 'h2',
  muted = false,
  children,
  className,
}: MarketingSectionProps) {
  return (
    <section className={cn(muted && 'bg-muted/40 border-y', 'px-6 py-16 sm:py-20')}>
      <div className={cn('mx-auto flex w-full max-w-5xl flex-col gap-10', className)}>
        {title === undefined ? null : (
          <div className="flex max-w-2xl flex-col gap-3">
            <Heading className="type-title text-balance sm:text-4xl">{title}</Heading>
            {subtitle === undefined ? null : (
              <p className="text-muted-foreground text-lg text-pretty">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
