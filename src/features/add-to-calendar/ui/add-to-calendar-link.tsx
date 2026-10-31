import { CalendarPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui';

import { calendarEntryHref, type CalendarEntryKind } from '../model/calendar-entry-href';

export function AddToCalendarLink({
  institutionId,
  kind,
  id,
  title,
}: {
  institutionId: string;
  kind: CalendarEntryKind;
  id: string;
  title: string;
}) {
  const t = useTranslations('calendar.addToCalendar');

  return (
    <Button asChild variant="outline" size="sm">
      <a
        href={calendarEntryHref(institutionId, kind, id)}
        download
        aria-label={t('label', { title })}
      >
        <CalendarPlus aria-hidden />
        {t('action')}
      </a>
    </Button>
  );
}
