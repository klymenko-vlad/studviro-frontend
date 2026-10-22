'use client';

import { useState, type ReactNode } from 'react';
import { PanelLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useInstitutionFeatures } from '@/entities/institution-configuration';
import { usePermissions } from '@/entities/permission';
import { usePathname } from '@/shared/config';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
} from '@/shared/ui';

import { visibleNavGroups } from '../model/nav-groups';
import { currentNavKey, NavLinks } from './nav-links';

/**
 * Every screen of an institution sits beside one grouped sidebar. A wide
 * screen keeps it in view; a narrow one gets a single bar that opens the same
 * groups in a sheet, rather than seventeen tabs wrapped onto four rows.
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
        <div
          data-translucent
          className="chrome-edge bg-background/80 sticky top-14 z-30 backdrop-blur-md lg:hidden"
        >
          <div className="flex w-full items-center px-4 py-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isPending}>
                  <PanelLeft aria-hidden />
                  <span>{t('sections')}</span>
                  {current === undefined ? null : (
                    <span className="text-muted-foreground font-normal">
                      · {t(current)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-72 overflow-y-auto overscroll-contain"
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
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
