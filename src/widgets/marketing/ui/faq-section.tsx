import { JsonLd } from '@/shared/seo';

import { MarketingSection } from './marketing-section';

export interface FaqItem {
  key: string;
  question: string;
  answer: string;
}

/**
 * Renders the questions and, alongside them, the same questions as `FAQPage`
 * structured data — built from one array, so the two can never drift.
 */
export function FaqSection({
  title,
  items,
}: {
  title: string;
  items: readonly FaqItem[];
}) {
  return (
    <MarketingSection title={title} muted>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />

      <dl className="grid gap-6 sm:grid-cols-2">
        {items.map(item => (
          <div key={item.key} className="flex flex-col gap-2">
            <dt className="font-medium">{item.question}</dt>
            <dd className="text-muted-foreground text-sm text-pretty">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </MarketingSection>
  );
}
