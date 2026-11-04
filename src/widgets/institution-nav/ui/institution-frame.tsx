'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useInstitutionFeatures } from '@/entities/institution-configuration';
import { usePermissions } from '@/entities/permission';
import {
  institutionRoutes,
  LAST_INSTITUTION_COOKIE,
  Link,
  SIDEBAR_COOKIE,
  usePathname,
} from '@/shared/config';
import { cn } from '@/shared/lib';
import {
  Button,
  Logo,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from '@/shared/ui';

import { bottomTabs } from '../model/bottom-tabs';
import { visibleNavGroups } from '../model/nav-groups';
import { BottomTabBar } from './bottom-tab-bar';
import { currentNavKey, NavLinks } from './nav-links';

/**
 * Every screen of an institution sits beside one grouped sidebar. A wide
 * screen keeps it in view; a phone gets a tab bar at the bottom with the four
 * screens a person returns to most, and _More_ opens the full grouped list in
 * a sheet rising from the same edge. The wide sidebar runs the full height of
 * the window with the brand at its head, so the header begins where it ends;
 * it folds down to its icons and stays that way across visits.
 */
export function InstitutionFrame({
  institutionId,
  defaultCollapsed = false,
  children,
}: {
  institutionId: string;
  defaultCollapsed?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    document.cookie = `${LAST_INSTITUTION_COOKIE}=${institutionId}; path=/; max-age=31536000; samesite=lax`;
  }, [institutionId]);
  const { can, roles, isPending } = usePermissions(institutionId);
  const features = useInstitutionFeatures(institutionId);

  const groups = isPending
    ? []
    : visibleNavGroups({ roles, can, isEnabled: features.isEnabled });
  const current = currentNavKey(groups, pathname, institutionId);

  const links = isPending ? (
    <div className="flex flex-col gap-2 px-3" data-testid="institution-nav-loading">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-7 w-full" />
      ))}
    </div>
  ) : (
    <NavLinks institutionId={institutionId} groups={groups} collapsed={collapsed} />
  );

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
  };
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div data-institution-frame className="flex flex-1">
      <aside
        data-collapsed={collapsed || undefined}
        className={cn(
          'bg-background border-border/60 sticky top-0 z-[45] -mt-14 hidden h-dvh shrink-0 flex-col overflow-x-hidden border-r transition-[width] duration-300 ease-(--ease-premium) motion-reduce:transition-none lg:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 px-3',
            collapsed
              ? 'flex-col items-start gap-3 pt-4'
              : 'h-14 items-center justify-between',
          )}
        >
          <Link
            href={institutionRoutes(institutionId).dashboard}
            aria-label={t('home')}
            className="focus-visible:ring-ring/50 ml-2 rounded-md outline-none focus-visible:ring-[3px]"
          >
            <Logo variant={collapsed ? 'mark' : 'full'} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
            className={cn('text-muted-foreground', collapsed && 'ml-0.5')}
          >
            <ToggleIcon aria-hidden />
          </Button>
        </div>
        <nav
          aria-label={t('institutionLabel')}
          className="flex-1 overflow-y-auto overscroll-contain px-3 pt-4 pb-6"
        >
          {links}
        </nav>
      </aside>

      <div className="dashboard-backdrop flex min-w-0 flex-1 flex-col">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[80dvh] overflow-y-auto overscroll-contain rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader>
              <SheetTitle>{t('sections')}</SheetTitle>
              <SheetDescription className="sr-only">
                {t('sectionsDescription')}
              </SheetDescription>
            </SheetHeader>
            <nav aria-label={t('institutionLabel')} className="px-3 pb-6">
              <NavLinks
                institutionId={institutionId}
                groups={groups}
                onNavigate={() => {
                  setOpen(false);
                }}
              />
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </div>

        {isPending ? null : (
          <BottomTabBar
            institutionId={institutionId}
            {...bottomTabs(groups)}
            current={current}
            moreOpen={open}
            onMore={() => {
              setOpen(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
