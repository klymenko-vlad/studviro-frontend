'use client';

import { useTranslations } from 'next-intl';

import { MyCalendar } from '@/widgets/my-calendar';
import { CalendarSubscription } from '@/features/subscribe-calendar';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function MyCalendarView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('calendar');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <PageShell>
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : can('schedule:read') ? (
        <>
          <MyCalendar institutionId={institutionId} />
          <CalendarSubscription institutionId={institutionId} />
        </>
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
