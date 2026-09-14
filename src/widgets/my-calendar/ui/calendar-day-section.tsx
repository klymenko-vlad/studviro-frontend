import { useFormatter, useTranslations } from 'next-intl';

import { courseOfferingHref } from '@/entities/course-offering';
import { DeadlineCard } from '@/entities/deadline';
import { ExamTermCard } from '@/entities/exam-term';
import { dayKey, TimetableEventCard } from '@/entities/timetable-event';

import type { CalendarDay } from '../model/calendar-items';

export function CalendarDaySection({
  day,
  institutionId,
  today,
  timeZone,
}: {
  day: CalendarDay;
  institutionId: string;
  today: Date;
  timeZone: string;
}) {
  const t = useTranslations('calendar');
  const format = useFormatter();

  return (
    <section className="flex flex-col gap-3" aria-labelledby={`calendar-day-${day.key}`}>
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 id={`calendar-day-${day.key}`} className="text-lg font-semibold">
          {format.dateTime(day.date, { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        {dayKey(today, timeZone) === day.key ? (
          <span className="text-muted-foreground text-sm">{t('today')}</span>
        ) : null}
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {day.items.map(item => (
          <li key={item.id}>
            {item.kind === 'event' ? (
              <TimetableEventCard
                event={item.event}
                href={courseOfferingHref(institutionId, item.event.offering.id)}
              />
            ) : item.kind === 'deadline' ? (
              <div className="flex flex-col gap-1.5" data-testid="calendar-deadline">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t('deadlineLayer')}
                </p>
                <DeadlineCard
                  deadline={item.deadline}
                  href={courseOfferingHref(institutionId, item.deadline.offering.id)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5" data-testid="calendar-exam">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t('examLayer')}
                </p>
                <ExamTermCard
                  term={item.term}
                  href={courseOfferingHref(institutionId, item.term.offering.id)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
