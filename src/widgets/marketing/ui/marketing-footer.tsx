import { useTranslations } from 'next-intl';

import { Link, ROUTES } from '@/shared/config';

const PRODUCT_LINKS = [
  { key: 'forStudents', href: ROUTES.forStudents },
  { key: 'forTeachers', href: ROUTES.forTeachers },
  { key: 'forInstitutions', href: ROUTES.forInstitutions },
  { key: 'contact', href: ROUTES.contact },
] as const;

export function MarketingFooter() {
  const t = useTranslations('marketing');
  const common = useTranslations('common');

  return (
    <footer className="border-border/60 mt-auto border-t px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="flex max-w-sm flex-col gap-2">
          <Link href={ROUTES.home} className="font-semibold tracking-tight">
            {common('appName')}
          </Link>
          <p className="text-muted-foreground text-sm text-pretty">
            {t('footer.tagline')}
          </p>
        </div>

        <nav aria-label={t('nav.sectionLabel')} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">{t('footer.product')}</h2>
          <ul className="flex flex-col gap-2">
            {PRODUCT_LINKS.map(link => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {t(`nav.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
