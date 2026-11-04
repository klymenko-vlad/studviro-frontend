import type { ReactNode } from 'react';

import { Link } from '@/shared/config';
import { LinkRow, LinkRowChevron, ToneDot } from '@/shared/ui';

/** One course in a dashboard tile: its colour, its name, a figure, and the way in. */
export function TileLinkRow({
  href,
  code,
  title,
  meta,
  figure,
}: {
  href: string;
  code: string;
  title: ReactNode;
  meta?: ReactNode;
  figure?: ReactNode;
}) {
  return (
    <li>
      <LinkRow asChild>
        <Link href={href}>
          <ToneDot code={code} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{title}</span>
            {meta === undefined ? null : (
              <span className="text-muted-foreground truncate text-xs">{meta}</span>
            )}
          </span>
          {figure === undefined ? null : (
            <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
              {figure}
            </span>
          )}
          <LinkRowChevron />
        </Link>
      </LinkRow>
    </li>
  );
}
