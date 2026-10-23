'use client';

import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LibraryBig,
  Network,
  Presentation,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { institutionRoutes, Link, usePathname } from '@/shared/config';
import { cn } from '@/shared/lib';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';

import type { NavKey, VisibleNavGroup } from '../model/nav-groups';

export const NAV_ICONS: Record<NavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  courses: BookOpen,
  grades: Award,
  exams: ClipboardCheck,
  teaching: Presentation,
  structure: Network,
  offer: LibraryBig,
  people: Users,
  settings: Settings,
};

/**
 * The dashboard is a prefix of every other screen, so it may only match
 * exactly — otherwise it stays current everywhere in the section.
 */
export function currentNavKey(groups: VisibleNavGroup[], pathname: string, base: string) {
  const routes = institutionRoutes(base);

  // A programme's page belongs to the teaching offer it is listed in.
  const programmes = `${routes.dashboard}/programs`;

  return groups
    .flatMap(group => group.items)
    .find(key =>
      key === 'dashboard'
        ? pathname === routes.dashboard
        : pathname.startsWith(routes[key]) ||
          (key === 'offer' && pathname.startsWith(programmes)),
    );
}

export function NavLinks({
  institutionId,
  groups,
  onNavigate,
  collapsed = false,
}: {
  institutionId: string;
  groups: VisibleNavGroup[];
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const routes = institutionRoutes(institutionId);
  const current = currentNavKey(groups, pathname, institutionId);

  return (
    <div className="flex flex-col gap-6">
      {groups.map(group => {
        const headingId = `nav-group-${group.key}`;

        return (
          <div key={group.key} className="flex flex-col gap-1">
            {group.key === 'general' ? null : (
              <>
                <p
                  id={headingId}
                  className={cn(
                    'text-muted-foreground px-3 pb-1 text-xs font-medium tracking-wide whitespace-nowrap uppercase',
                    collapsed && 'sr-only',
                  )}
                >
                  {t(`groups.${group.key}`)}
                </p>
                {collapsed ? (
                  <span aria-hidden className="bg-border mx-3 mb-2 h-px" />
                ) : null}
              </>
            )}

            <ul
              aria-labelledby={group.key === 'general' ? undefined : headingId}
              className="flex flex-col gap-0.5"
            >
              {group.items.map(key => {
                const Icon = NAV_ICONS[key];
                const isCurrent = key === current;

                const link = (
                  <Link
                    href={routes[key]}
                    onClick={onNavigate}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={cn(
                      'focus-visible:ring-ring/50 flex items-center gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors duration-300 outline-none focus-visible:ring-[3px] motion-reduce:transition-none',
                      isCurrent
                        ? 'bg-secondary text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    <span className={cn(collapsed && 'sr-only')}>{t(key)}</span>
                  </Link>
                );

                return (
                  <li key={key}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {t(key)}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
