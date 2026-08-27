'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { courseOfferingQueries } from '@/entities/course-offering';
import { toApiError } from '@/shared/api';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { OfferingEnrollment } from './offering-enrollment';
import { OfferingHeader } from './offering-header';
import { OfferingStaff } from './offering-staff';

export function CourseOffering({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('courseOffering');
  const { data, isPending, error } = useQuery(
    courseOfferingQueries.detail({ path: { institutionId, offeringId } }),
  );

  if (isPending)
    return <Skeleton className="h-96 w-full" data-testid="course-offering-loading" />;

  if (error) {
    const { status } = toApiError(error);
    const reason = status === 404 ? 'notFound' : status === 403 ? 'denied' : 'error';

    return (
      <Alert variant={reason === 'error' ? 'destructive' : 'default'}>
        <AlertTitle>{t(`${reason}Title`)}</AlertTitle>
        <AlertDescription>{t(`${reason}Description`)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <OfferingHeader offering={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <OfferingStaff offering={data} />
        <OfferingEnrollment offering={data} />
      </div>
    </div>
  );
}
