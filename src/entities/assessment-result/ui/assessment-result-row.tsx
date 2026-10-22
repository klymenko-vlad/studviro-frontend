import { useFormatter, useTranslations } from 'next-intl';

import { Badge, TableCell, TableRow } from '@/shared/ui';

import { type AssessmentResult } from '../model/assessment-result';

export function AssessmentResultRow({ result }: { result: AssessmentResult }) {
  const t = useTranslations('learning.assessments');
  // The hand-in vocabulary is the deadline card's; there is one copy of it.
  const submitted = useTranslations('deadlines.submission');
  const format = useFormatter();
  const { activity } = result;

  return (
    <TableRow>
      <TableCell className="align-top">
        <span className="font-medium">{result.name}</span>

        {activity?.dueAt == null ? null : (
          <span className="text-muted-foreground block text-xs">
            {t('dueOn', {
              on: format.dateTime(new Date(activity.dueAt), { dateStyle: 'medium' }),
            })}
          </span>
        )}

        {result.countsTowardFinalGrade ? null : (
          <span className="text-muted-foreground block text-xs">{t('notCounted')}</span>
        )}

        {result.feedback === null || result.feedback === '' ? null : (
          <span className="mt-2 block text-xs" data-testid="assessment-feedback">
            <span className="text-muted-foreground block">{t('feedback')}</span>
            <span className="block whitespace-pre-line">{result.feedback}</span>
          </span>
        )}
      </TableCell>

      <TableCell className="align-top">
        {result.points === null ? (
          <span className="text-muted-foreground">{t('ungraded')}</span>
        ) : (
          <>
            <span className="font-medium">
              {result.maxPoints === null
                ? result.points
                : t('score', { points: result.points, maxPoints: result.maxPoints })}
            </span>
            {result.percentage === null ? null : (
              <span className="text-muted-foreground block text-xs">
                {t('percentage', { percentage: result.percentage })}
              </span>
            )}
          </>
        )}
      </TableCell>

      <TableCell className="align-top">
        <div className="flex flex-wrap gap-1">
          {activity?.submission == null ? null : (
            <Badge variant={activity.submission.isLate ? 'destructive' : 'secondary'}>
              {submitted(`state.${activity.submission.state}`)}
            </Badge>
          )}
          {activity?.completionState == null ? null : (
            <Badge variant="outline">{t(`completion.${activity.completionState}`)}</Badge>
          )}
        </div>

        {result.gradedAt === null ? null : (
          <span className="text-muted-foreground block text-xs">
            {t('gradedOn', {
              on: format.dateTime(new Date(result.gradedAt), { dateStyle: 'medium' }),
            })}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
