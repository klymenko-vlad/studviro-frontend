import { useTranslations } from 'next-intl';

import { MarketingFooter } from '@/widgets/marketing';
import { RequestDemo } from '@/features/request-demo';

const NEXT_STEPS = ['one', 'two', 'three'] as const;

export function ContactView({ captchaEnabled = false }: { captchaEnabled?: boolean }) {
  const t = useTranslations('contact');

  return (
    <>
      <main id="main-content" className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16 sm:py-20 lg:flex-row lg:gap-16">
          <div className="flex max-w-xl flex-1 flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="type-display">{t('title')}</h1>
              <p className="text-muted-foreground text-lg text-pretty">{t('subtitle')}</p>
            </div>

            <RequestDemo captchaEnabled={captchaEnabled} />
          </div>

          <aside className="flex flex-col gap-4 lg:max-w-xs">
            <h2 className="font-semibold">{t('aside.title')}</h2>
            <ul className="text-muted-foreground flex flex-col gap-3 text-sm">
              {NEXT_STEPS.map(key => (
                <li key={key} className="border-primary/40 border-l-2 pl-4 text-pretty">
                  {t(`aside.${key}`)}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>

      <MarketingFooter />
    </>
  );
}
