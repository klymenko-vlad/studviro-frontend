import { useTranslations } from 'next-intl';

import {
  FeatureGrid,
  MarketingCta,
  MarketingFooter,
  MarketingHero,
  MarketingSection,
} from '@/widgets/marketing';
import { ROUTES } from '@/shared/config';

const FEATURES = ['offerings', 'roster', 'calendar', 'course'] as const;

export function ForTeachersView() {
  const t = useTranslations('forTeachers');
  const m = useTranslations('marketing');

  return (
    <>
      <main className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow={m('nav.forTeachers')}
          title={t('hero.title')}
          subtitle={t('hero.subtitle')}
          primary={{ href: ROUTES.contact, label: m('cta.requestDemo') }}
          secondary={{ href: ROUTES.signIn, label: m('cta.signIn') }}
        />

        <MarketingSection title={t('features.title')} muted>
          <FeatureGrid
            items={FEATURES.map(key => ({
              key,
              title: t(`features.${key}.title`),
              body: t(`features.${key}.body`),
            }))}
          />
        </MarketingSection>

        <MarketingSection title={t('roadmap.title')}>
          <p className="text-muted-foreground max-w-2xl text-pretty">
            {t('roadmap.body')}
          </p>
        </MarketingSection>

        <MarketingCta
          title={t('closing.title')}
          body={t('closing.body')}
          action={t('closing.cta')}
        />
      </main>

      <MarketingFooter />
    </>
  );
}
