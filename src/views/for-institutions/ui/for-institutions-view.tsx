import { useTranslations } from 'next-intl';

import {
  FeatureGrid,
  HowItWorks,
  MarketingCta,
  MarketingFooter,
  MarketingHero,
  MarketingSection,
} from '@/widgets/marketing';
import { ROUTES } from '@/shared/config';

const FEATURES = ['connectors', 'sync', 'reconciliation', 'roles', 'model'] as const;
const DEPLOYMENT = ['containers', 'contract', 'mock'] as const;
const ROADMAP = ['lms', 'writeback', 'sso', 'export'] as const;
const STEPS = ['connect', 'import', 'use'] as const;

export function ForInstitutionsView() {
  const t = useTranslations('forInstitutions');
  const m = useTranslations('marketing');

  return (
    <>
      <main id="main-content" className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow={m('nav.forInstitutions')}
          title={t('hero.title')}
          subtitle={t('hero.subtitle')}
          primary={{ href: ROUTES.contact, label: m('cta.requestDemo') }}
          secondary={{ href: ROUTES.signIn, label: m('cta.signIn') }}
        />

        <MarketingSection
          title={m('howItWorks.title')}
          subtitle={m('howItWorks.subtitle')}
          muted
        >
          <HowItWorks
            steps={STEPS.map(key => ({
              key,
              title: m(`howItWorks.${key}.title`),
              body: m(`howItWorks.${key}.body`),
            }))}
          />
        </MarketingSection>

        <MarketingSection title={t('features.title')}>
          <FeatureGrid
            items={FEATURES.map(key => ({
              key,
              title: t(`features.${key}.title`),
              body: t(`features.${key}.body`),
            }))}
          />
        </MarketingSection>

        <MarketingSection title={m('trust.title')} subtitle={m('trust.subtitle')} muted>
          <FeatureGrid
            columns={2}
            items={(
              ['credentials', 'permissions', 'provenance', 'readOnly'] as const
            ).map(key => ({
              key,
              title: m(`trust.${key}.title`),
              body: m(`trust.${key}.body`),
            }))}
          />
        </MarketingSection>

        <MarketingSection title={t('deployment.title')}>
          <FeatureGrid
            items={DEPLOYMENT.map(key => ({
              key,
              title: t(`deployment.${key}.title`),
              body: t(`deployment.${key}.body`),
            }))}
          />
        </MarketingSection>

        <MarketingSection
          title={t('roadmap.title')}
          subtitle={t('roadmap.subtitle')}
          muted
        >
          <FeatureGrid
            columns={2}
            items={ROADMAP.map(key => ({
              key,
              title: t(`roadmap.${key}.title`),
              body: t(`roadmap.${key}.body`),
            }))}
          />
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
