'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { StudentDashboard } from '@/widgets/student-dashboard';
import { institutionQueries } from '@/entities/institution';
import { usePermissions } from '@/entities/permission';

export function StudentDashboardView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('dashboard');
  const { can, isPending } = usePermissions(institutionId);
  const institution = useQuery(institutionQueries.detail({ path: { institutionId } }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {institution.data?.name ?? t('title')}
        </h1>
        <p className="text-muted-foreground text-pretty">{t('subtitle')}</p>
      </header>

      {isPending ? null : (
        <StudentDashboard
          institutionId={institutionId}
          canReadCourses={can('enrollment:read')}
          canReadGrades={can('grade:read')}
        />
      )}
    </main>
  );
}
