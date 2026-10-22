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
  EmptyState,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
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
          <TableSkeleton rows={4} data-testid="offering-assessments-loading" />
        ) : isError ? (
          <p className="text-muted-foreground">{t('error')}</p>
        ) : data.length === 0 ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <Table label={t('panel')}>
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
