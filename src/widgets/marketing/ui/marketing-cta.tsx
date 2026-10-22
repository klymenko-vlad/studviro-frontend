import { ArrowRight } from 'lucide-react';

import { Link, ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui';

/** The closing call to action every marketing page ends on. */
export function MarketingCta({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: string;
}) {
  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="bg-card mx-auto flex w-full max-w-5xl flex-col items-start gap-5 rounded-xl border p-8 sm:p-12">
        <h2 className="type-title text-2xl text-balance sm:text-3xl">{title}</h2>
        <p className="text-muted-foreground max-w-2xl text-pretty">{body}</p>
        <Button asChild size="lg">
          <Link href={ROUTES.contact}>
            {action}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
