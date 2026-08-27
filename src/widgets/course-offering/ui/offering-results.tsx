import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { CourseResultCard, courseResultQueries } from '@/entities/course-result';
import { usePermissions } from '@/entities/permission';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

export function OfferingResults({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('grades');
  const { can } = usePermissions(institutionId);
  const { data, isPending, isError } = useQuery({
    ...courseResultQueries.list({ path: { institutionId }, query: { offeringId } }),
    enabled: can('grade:read'),
  });

  if (!can('grade:read')) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('offeringPanel')}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 text-sm">
        {isPending ? (
          <Skeleton className="h-24 w-full" data-testid="offering-results-loading" />
        ) : isError ? (
          <p className="text-muted-foreground">{t('errorDescription')}</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground">{t('noOfferingResult')}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {data.map(result => (
              <li key={result.id}>
                <CourseResultCard result={result} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
