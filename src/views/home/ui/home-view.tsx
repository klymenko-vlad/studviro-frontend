import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SwitchLocale } from '@/features/switch-locale';
import { ThemeToggle } from '@/features/theme-toggle';
import { Link } from '@/shared/config';
import { Button, Separator } from '@/shared/ui';

/**
 * Page composition for `/`. Views own layout and which widgets appear; they hold
 * no business logic, which is what keeps them renderable in a test without the
 * Next.js router.
 */
export function HomeView() {
  const t = useTranslations('home');

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-end gap-2 p-4">
        <Button asChild variant="ghost">
          <Link href="/account">{t('account')}</Link>
        </Button>
        <SwitchLocale />
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-24 text-center">
        <div className="flex max-w-2xl flex-col items-center gap-4">
          <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
            {t('title')}
          </h1>
          <p className="text-muted-foreground max-w-prose text-lg text-pretty">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg">
            {t('getStarted')}
            <ArrowRight aria-hidden />
          </Button>
          <Button size="lg" variant="outline">
            {t('learnMore')}
          </Button>
        </div>

        <Separator className="max-w-xs" />
      </div>
    </main>
  );
}
