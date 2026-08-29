import { useFormatter, useTranslations } from 'next-intl';

import { courseOfferingHref } from '@/entities/course-offering';
import {
  dayKey,
  TimetableEventCard,
  type TimetableDay,
} from '@/entities/timetable-event';

export function CalendarDaySection({
  day,
  institutionId,
  today,
  timeZone,
}: {
  day: TimetableDay;
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
        {day.events.map(event => (
          <li key={event.id}>
            <TimetableEventCard
              event={event}
              href={courseOfferingHref(institutionId, event.offering.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
