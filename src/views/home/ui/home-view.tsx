import { useTranslations } from 'next-intl';

import {
  AudienceCards,
  FaqSection,
  FeatureGrid,
  HowItWorks,
  MarketingCta,
  MarketingFooter,
  MarketingHero,
  MarketingSection,
} from '@/widgets/marketing';
import { LANDING_ROUTE, ROUTES } from '@/shared/config';

const FEATURES = ['dashboard', 'calendar', 'course', 'exams', 'sync'] as const;
const PROBLEM_POINTS = ['one', 'two', 'three'] as const;
const STEPS = ['connect', 'import', 'use'] as const;
const FAQS = ['replace', 'lms', 'accounts', 'conflict', 'cost'] as const;
const AUDIENCES = [
  { key: 'students', href: ROUTES.forStudents },
  { key: 'teachers', href: ROUTES.forTeachers },
  { key: 'institutions', href: ROUTES.forInstitutions },
] as const;

/**
 * Page composition for `/`. Views own layout and which widgets appear; they
 * hold no business logic.
 *
 * The secondary call to action depends on whether there is a session: offering
 * "Sign in" to someone already signed in is the fastest way to make an app feel
 * like a set of unconnected screens.
 */
export function HomeView({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations('home');
  const m = useTranslations('marketing');

  return (
    <>
      <main className="flex flex-1 flex-col">
        <MarketingHero
          title={t('title')}
          subtitle={t('subtitle')}
          primary={{ href: ROUTES.contact, label: m('cta.requestDemo') }}
          secondary={
            signedIn
              ? { href: LANDING_ROUTE, label: t('signedInCta') }
              : { href: ROUTES.signIn, label: m('cta.signIn') }
          }
        />

        <MarketingSection title={t('problem.title')} subtitle={t('problem.body')} muted>
          <FeatureGrid
            items={PROBLEM_POINTS.map(key => ({
              key,
              title: t(`problem.${key}.title`),
              body: t(`problem.${key}.body`),
            }))}
          />
        </MarketingSection>

        <MarketingSection title={t('features.title')} subtitle={t('features.subtitle')}>
          <FeatureGrid
            items={FEATURES.map(key => ({
              key,
              title: t(`features.${key}.title`),
              body: t(`features.${key}.body`),
            }))}
          />
        </MarketingSection>

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

        <MarketingSection title={m('audiences.title')} subtitle={m('audiences.subtitle')}>
          <AudienceCards
            items={AUDIENCES.map(audience => ({
              key: audience.key,
              href: audience.href,
              title: m(`audiences.${audience.key}.title`),
              body: m(`audiences.${audience.key}.body`),
            }))}
          />
        </MarketingSection>

        <MarketingSection title={m('trust.title')} subtitle={m('trust.subtitle')}>
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

        <FaqSection
          title={m('faq.title')}
          items={FAQS.map(key => ({
            key,
            question: m(`faq.${key}.question`),
            answer: m(`faq.${key}.answer`),
          }))}
        />

        <MarketingCta
          title={m('closing.title')}
          body={m('closing.body')}
          action={m('closing.cta')}
        />
      </main>

      <MarketingFooter />
    </>
  );
}
