'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { CourseOffering } from '@/widgets/course-offering';
import { PageTrail, type Crumb } from '@/widgets/page-trail';
import {
  courseOfferingQueries,
  type CourseOfferingViewerRole,
} from '@/entities/course-offering';
import { usePermissions } from '@/entities/permission';
import { institutionRoutes } from '@/shared/config';
import { Alert, AlertDescription, AlertTitle, PageShell } from '@/shared/ui';

/**
 * A course page is reached three ways, and the trail above it says which: a
 * student from their courses, a teacher from their teaching, an administrator
 * from the teaching offer.
 */
export function CourseOfferingView({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('courseOffering');
  const nav = useTranslations('nav');
  const hubs = useTranslations('hubs.offer');
  const { can, isPending } = usePermissions(institutionId);
  const offering = useQuery({
    ...courseOfferingQueries.detail({ path: { institutionId, offeringId } }),
    enabled: can('offering:read'),
  });
  const routes = institutionRoutes(institutionId);

  const above = (role: CourseOfferingViewerRole): Crumb[] =>
    role === 'student'
      ? [{ label: nav('courses'), href: routes.courses }]
      : role === 'teacher'
        ? [{ label: nav('teaching'), href: routes.teaching }]
        : [
            { label: nav('offer'), href: routes.offer },
            { label: hubs('tabs.offerings'), href: `${routes.offer}?tab=offerings` },
          ];

  return (
    <PageShell>
      <PageTrail
        crumbs={offering.data === undefined ? [] : above(offering.data.viewerRole)}
        current={offering.data?.course.title}
      />

      {isPending ? null : can('offering:read') ? (
        <CourseOffering institutionId={institutionId} offeringId={offeringId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
