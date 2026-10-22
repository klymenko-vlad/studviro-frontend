import { useFormatter, useTranslations } from 'next-intl';

import { courseOfferingHref } from '@/entities/course-offering';
import {
  CourseResultCard,
  termCredits,
  type TermResults,
} from '@/entities/course-result';

export function TermResultsSection({
  group,
  institutionId,
}: {
  group: TermResults;
  institutionId: string;
}) {
  const t = useTranslations('grades');
  const format = useFormatter();

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby={`term-results-${group.term.id}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`term-results-${group.term.id}`} className="text-lg font-semibold">
          {group.term.name}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t('termSummary', {
            results: group.results.length,
            credits: termCredits(group.results),
            starts: format.dateTime(new Date(group.term.startsAt), {
              dateStyle: 'medium',
            }),
          })}
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {group.results.map(result => (
          <li key={result.id}>
            <CourseResultCard
              result={result}
              href={courseOfferingHref(institutionId, result.offering.id, {
                section: 'work',
              })}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
