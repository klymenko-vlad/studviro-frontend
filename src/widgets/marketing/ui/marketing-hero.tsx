import { ArrowRight } from 'lucide-react';

import { Link } from '@/shared/config';
import { Button } from '@/shared/ui';

export interface MarketingHeroAction {
  href: string;
  label: string;
}

interface MarketingHeroProps {
  title: string;
  subtitle: string;
  primary: MarketingHeroAction;
  secondary?: MarketingHeroAction;
  eyebrow?: string;
}

/** The single `h1` of whichever page renders it. */
export function MarketingHero({
  title,
  subtitle,
  primary,
  secondary,
  eyebrow,
}: MarketingHeroProps) {
  return (
    <section className="px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
        {eyebrow === undefined ? null : (
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {eyebrow}
          </p>
        )}

        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {title}
        </h1>

        <p className="text-muted-foreground max-w-2xl text-lg text-pretty sm:text-xl">
          {subtitle}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={primary.href}>
              {primary.label}
              <ArrowRight aria-hidden />
            </Link>
          </Button>

          {secondary === undefined ? null : (
            <Button asChild variant="outline" size="lg">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
