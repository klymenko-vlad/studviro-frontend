'use client';

import type { ComponentProps } from 'react';
import { Ellipsis, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { institutionRoutes, Link } from '@/shared/config';
import { cn } from '@/shared/lib';

import type { NavKey } from '../model/nav-groups';
import { NAV_ICONS } from './nav-links';

/**
 * The phone's way round an institution: the person's own screens, five at
 * most, with _More_ in the last slot when there are others. Sits above the
 * home indicator, never under it.
 */
export function BottomTabBar({
  institutionId,
  tabs,
  more,
  current,
  moreOpen,
  onMore,
}: {
  institutionId: string;
  tabs: NavKey[];
  /** Whether some screens did not fit, so the last slot opens them all. */
  more: boolean;
  current: NavKey | undefined;
  moreOpen: boolean;
  onMore: () => void;
}) {
  const t = useTranslations('nav');
  const routes = institutionRoutes(institutionId);
  const elsewhere = current !== undefined && !tabs.includes(current);

  return (
    <nav
      aria-label={t('tabBarLabel')}
      data-translucent
      className="bg-background/80 border-border/60 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch px-2">
        {tabs.map(key => (
          <li key={key} className="flex-1">
            <Tab
              icon={NAV_ICONS[key]}
              label={t(key)}
              active={key === current}
              href={routes[key]}
            />
          </li>
        ))}
        {more ? (
          <li className="flex-1">
            <Tab
              icon={Ellipsis}
              label={t('more')}
              active={moreOpen || elsewhere}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={onMore}
            />
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

function Tab({
  icon: Icon,
  label,
  active,
  href,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  href?: string;
} & Omit<ComponentProps<'button'>, 'children'>) {
  const className = cn(
    'group flex w-full flex-col items-center gap-1 pt-2 pb-1.5 text-[11px] font-medium outline-none transition-colors duration-300',
    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
  );
  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          'group-focus-visible:ring-ring/50 grid h-7 w-14 place-items-center rounded-full transition-[background-color,transform] duration-500 ease-(--ease-premium) group-focus-visible:ring-[3px] group-active:scale-90',
          active ? 'bg-secondary' : 'bg-transparent',
        )}
      >
        <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
      </span>
      <span className="max-w-full truncate px-1">{label}</span>
    </>
  );

  if (href !== undefined) {
    return (
      <Link href={href} aria-current={active ? 'page' : undefined} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" className={className} {...rest}>
      {body}
    </button>
  );
}
