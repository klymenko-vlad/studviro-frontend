import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  assessmentResultQueries,
  AssessmentResultRow,
} from '@/entities/assessment-result';
import { usePermissions } from '@/entities/permission';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

export function OfferingAssessments({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('learning.assessments');
  const { can } = usePermissions(institutionId);
  const { data, isPending, isError } = useQuery({
    ...assessmentResultQueries.list({ path: { institutionId }, query: { offeringId } }),
    enabled: can('grade:read'),
  });

  if (!can('grade:read')) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('panel')}</CardTitle>
      </CardHeader>

      <CardContent className="text-sm">
        {isPending ? (
          <Skeleton className="h-24 w-full" data-testid="offering-assessments-loading" />
        ) : isError ? (
          <p className="text-muted-foreground">{t('error')}</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground">{t('empty')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('column.assessment')}</TableHead>
                <TableHead>{t('column.score')}</TableHead>
                <TableHead>{t('column.state')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(result => (
                <AssessmentResultRow key={result.id} result={result} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
