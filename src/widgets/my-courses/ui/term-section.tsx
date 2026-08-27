import { useFormatter, useTranslations } from 'next-intl';

import {
  EnrolledCourseCard,
  totalCredits,
  type TermCourses,
} from '@/entities/enrolled-course';

export function TermSection({ group }: { group: TermCourses }) {
  const t = useTranslations('myCourses');
  const format = useFormatter();

  return (
    <section className="flex flex-col gap-3" aria-labelledby={`term-${group.term.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`term-${group.term.id}`} className="text-lg font-semibold">
          {group.term.name}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t('termSummary', {
            courses: group.courses.length,
            credits: totalCredits(group.courses),
            starts: format.dateTime(new Date(group.term.startsAt), {
              dateStyle: 'medium',
            }),
          })}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.courses.map(course => (
          <li key={course.enrollmentId}>
            <EnrolledCourseCard course={course} />
          </li>
        ))}
      </ul>
    </section>
  );
}
