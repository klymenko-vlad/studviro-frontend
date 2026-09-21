'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, ROUTES } from '@/shared/config';
import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui';

import { MARKETING_LINKS } from './marketing-links';

/**
 * The product links a narrow screen has no room for in the bar. The old header
 * wrapped them onto three rows instead, which cost a phone most of the space
 * above the fold before any content.
 */
export function MobileMenu() {
  const t = useTranslations('nav');
  const marketing = useTranslations('marketing');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label={t('menu')}>
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72 overscroll-contain">
        <SheetHeader>
          <SheetTitle>{t('menu')}</SheetTitle>
          <SheetDescription className="sr-only">{t('menuDescription')}</SheetDescription>
        </SheetHeader>

        <nav aria-label={marketing('nav.sectionLabel')} className="flex flex-col px-4">
          {MARKETING_LINKS.map(link => (
            <SheetClose key={link.key} asChild>
              <Link
                href={link.href}
                className="hover:bg-accent focus-visible:ring-ring/50 rounded-md px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px]"
              >
                {marketing(`nav.${link.key}`)}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t p-4">
          <SheetClose asChild>
            <Button asChild variant="outline">
              <Link href={ROUTES.signIn}>{t('signIn')}</Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild>
              <Link href={ROUTES.signUp}>{t('signUp')}</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
