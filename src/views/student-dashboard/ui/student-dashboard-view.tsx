'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { StudentDashboard } from '@/widgets/student-dashboard';
import { institutionQueries } from '@/entities/institution';
import { usePermissions } from '@/entities/permission';
import { PageHeader, PageShell } from '@/shared/ui';

export function StudentDashboardView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('dashboard');
  const { can, isPending } = usePermissions(institutionId);
  const institution = useQuery(institutionQueries.detail({ path: { institutionId } }));

  return (
    <PageShell>
      <PageHeader
        title={institution.data?.name ?? t('title')}
        description={t('subtitle')}
      />

      {isPending ? null : (
        <StudentDashboard
          institutionId={institutionId}
          canReadCourses={can('enrollment:read')}
          canReadGrades={can('grade:read')}
          canReadSchedule={can('schedule:read')}
        />
      )}
    </PageShell>
  );
}
