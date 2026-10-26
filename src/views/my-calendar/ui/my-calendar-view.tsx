'use client';

import { useTranslations } from 'next-intl';

import { MyCalendar } from '@/widgets/my-calendar';
import { MyTasks } from '@/widgets/my-tasks';
import { PageTabs } from '@/widgets/page-tabs';
import { CalendarSubscription } from '@/features/subscribe-calendar';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function MyCalendarView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('calendar');
  const tPlanner = useTranslations('planner');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <PageShell>
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : can('schedule:read') ? (
        <PageTabs
          label={tPlanner('tabsLabel')}
          tabs={[
            {
              key: 'calendar',
              label: tPlanner('tabCalendar'),
              content: (
                <>
                  <MyCalendar institutionId={institutionId} />
                  <CalendarSubscription institutionId={institutionId} />
                </>
              ),
            },
            {
              key: 'tasks',
              label: tPlanner('tabTasks'),
              content: <MyTasks institutionId={institutionId} />,
            },
          ]}
        />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
