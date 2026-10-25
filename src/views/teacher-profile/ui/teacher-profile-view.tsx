'use client';

import { useTranslations } from 'next-intl';

import { PageTrail } from '@/widgets/page-trail';
import { TeacherProfile } from '@/widgets/teacher-profile';
import { institutionRoutes } from '@/shared/config';
import { PageShell } from '@/shared/ui';

export function TeacherProfileView({
  institutionId,
  teacherId,
}: {
  institutionId: string;
  teacherId: string;
}) {
  const nav = useTranslations('nav');

  return (
    <PageShell width="detail">
      <PageTrail
        crumbs={[{ label: nav('search'), href: institutionRoutes(institutionId).search }]}
      />
      <TeacherProfile institutionId={institutionId} teacherId={teacherId} />
    </PageShell>
  );
}
