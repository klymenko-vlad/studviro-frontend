import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  courseRosterQueries,
  enrolledStudents,
  RosterTable,
} from '@/entities/course-roster';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

export function OfferingRoster({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('roster');
  const { data, isPending, isError } = useQuery(
    courseRosterQueries.detail({ path: { institutionId, offeringId } }),
  );

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{t('panelTitle')}</CardTitle>
        {isPending || isError ? null : (
          <p className="text-muted-foreground text-sm">
            {data.offering.capacity === null
              ? t('summary', {
                  enrolled: enrolledStudents(data).length,
                  total: data.students.length,
                })
              : t('summaryWithCapacity', {
                  enrolled: enrolledStudents(data).length,
                  total: data.students.length,
                  capacity: data.offering.capacity,
                })}
          </p>
        )}
      </CardHeader>

      <CardContent className="text-sm">
        {isPending ? (
          <Skeleton className="h-24 w-full" data-testid="offering-roster-loading" />
        ) : isError ? (
          <p className="text-muted-foreground">{t('errorDescription')}</p>
        ) : data.students.length === 0 ? (
          <p className="text-muted-foreground">{t('empty')}</p>
        ) : (
          <RosterTable students={data.students} caption={t('tableCaption')} />
        )}
      </CardContent>
    </Card>
  );
}
