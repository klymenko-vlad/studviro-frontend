import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

import { Link } from '@/shared/config';
import { toneStyle } from '@/shared/lib';

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
      <Link
        href={href}
        style={toneStyle(code)}
        className="tone group hover:bg-secondary/70 focus-visible:ring-ring/50 flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-300 outline-none focus-visible:ring-[3px]"
      >
        <span aria-hidden className="bg-tone size-2 shrink-0 rounded-full" />
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
        <ChevronRight
          aria-hidden
          className="text-muted-foreground size-4 shrink-0 transition-transform duration-500 ease-(--ease-premium) group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </Link>
    </li>
  );
}
