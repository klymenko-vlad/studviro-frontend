'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { useInstitutionFeatures } from '@/entities/institution-configuration';
import { usePermissions } from '@/entities/permission';
import { usePathname } from '@/shared/config';
import {
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
 * a sheet rising from the same edge.
 */
export function InstitutionFrame({
  institutionId,
  children,
}: {
  institutionId: string;
  children: ReactNode;
}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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
    <NavLinks institutionId={institutionId} groups={groups} />
  );

  return (
    <div data-institution-frame className="flex flex-1">
      <aside className="border-border/60 sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto overscroll-contain border-r lg:block">
        <nav aria-label={t('institutionLabel')} className="px-3 py-6">
          {links}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
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
