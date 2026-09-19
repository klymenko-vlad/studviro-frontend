'use client';

import { useTranslations } from 'next-intl';

import { CourseOffering } from '@/widgets/course-offering';
import { usePermissions } from '@/entities/permission';
import { Link } from '@/shared/config';
import { Alert, AlertDescription, AlertTitle, Button } from '@/shared/ui';

export function CourseOfferingView({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('courseOffering');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12"
    >
      <Button variant="ghost" size="sm" className="self-start" asChild>
        <Link href={`/institutions/${institutionId}/courses`}>{t('backToCourses')}</Link>
      </Button>

      {isPending ? null : can('offering:read') ? (
        <CourseOffering institutionId={institutionId} offeringId={offeringId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
