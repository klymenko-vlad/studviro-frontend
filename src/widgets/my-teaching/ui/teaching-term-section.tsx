import { useFormatter, useTranslations } from 'next-intl';

import { courseOfferingHref } from '@/entities/course-offering';
import {
  TeachingOfferingCard,
  totalEnrolled,
  type TermTeachingOfferings,
} from '@/entities/teaching-offering';

export function TeachingTermSection({
  group,
  institutionId,
}: {
  group: TermTeachingOfferings;
  institutionId: string;
}) {
  const t = useTranslations('myTeaching');
  const format = useFormatter();

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby={`teaching-term-${group.term.id}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`teaching-term-${group.term.id}`} className="text-lg font-semibold">
          {group.term.name}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t('termSummary', {
            offerings: group.offerings.length,
            students: totalEnrolled(group.offerings),
            starts: format.dateTime(new Date(group.term.startsAt), {
              dateStyle: 'medium',
            }),
          })}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.offerings.map(offering => (
          <li key={offering.assignmentId}>
            <TeachingOfferingCard
              offering={offering}
              href={courseOfferingHref(institutionId, offering.offering.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
