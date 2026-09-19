import { ArrowRight } from 'lucide-react';

import { Link } from '@/shared/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export interface AudienceItem {
  key: string;
  title: string;
  body: string;
  href: string;
}

/**
 * The cross-link between the landing pages. The whole card is the link target
 * rather than a trailing "read more", so the hit area matches what a reader
 * takes to be clickable.
 */
export function AudienceCards({ items }: { items: readonly AudienceItem[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {items.map(item => (
        <li key={item.key} className="flex">
          <Card className="hover:border-ring focus-within:border-ring relative w-full gap-3 transition-colors">
            <CardHeader>
              <CardTitle as="h3" className="text-base">
                <Link
                  href={item.href}
                  className="after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {item.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground flex items-end gap-2 text-sm text-pretty">
              <span>{item.body}</span>
              <ArrowRight className="mt-1 size-4 shrink-0" aria-hidden />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
