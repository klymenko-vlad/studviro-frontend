import type { ReactNode } from 'react';

import { Link } from '@/shared/config';

export function GlanceStat({
  href,
  label,
  value,
  detail,
  note,
}: {
  href: string;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  note?: ReactNode;
}) {
  return (
    <li className="flex">
      <Link
        href={href}
        className="bg-card hover:bg-secondary/70 focus-visible:ring-ring/50 flex min-w-0 flex-1 flex-col gap-1 rounded-xl border p-4 transition-colors duration-300 outline-none focus-visible:ring-[3px] motion-reduce:transition-none"
      >
        <span className="text-muted-foreground type-eyebrow">{label}</span>
        <span className="truncate text-xl font-semibold tabular-nums">{value}</span>
        {detail === undefined ? null : (
          <span className="text-muted-foreground truncate text-sm">{detail}</span>
        )}
        {note}
      </Link>
    </li>
  );
}
