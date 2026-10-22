import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { ExamRegistrationButton } from '@/features/exam-registration';
import { offeringItemAnchor } from '@/entities/course-offering';
import { ExamTermCard, examTermQueries } from '@/entities/exam-term';
import { usePermissions } from '@/entities/permission';
import { institutionRoutes, Link } from '@/shared/config';
import { revealTargetClassName, useRevealHashTarget } from '@/shared/lib';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ListSkeleton,
  QueryError,
} from '@/shared/ui';

export function OfferingExams({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('exams');
  const { can } = usePermissions(institutionId);
  const { data, isPending, isError, refetch } = useQuery({
    ...examTermQueries.list({ path: { institutionId }, query: { offeringId } }),
    enabled: can('schedule:read'),
  });
  useRevealHashTarget(data !== undefined);

  if (!can('schedule:read')) return null;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{t('offeringPanel')}</CardTitle>
        <Link
          href={institutionRoutes(institutionId).exams}
          className="text-sm underline-offset-4 hover:underline focus-visible:underline"
        >
          {t('seeAll')}
        </Link>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 text-sm">
        {isPending ? (
          <ListSkeleton items={2} data-testid="offering-exams-loading" />
        ) : isError ? (
          <QueryError
            onRetry={refetch}
            title={t('errorTitle')}
            description={t('errorDescription')}
          />
        ) : data.length === 0 ? (
          <p className="text-muted-foreground">{t('noOfferingExams')}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {data.map(term => (
              <li
                key={term.id}
                id={offeringItemAnchor({ kind: 'exam-term', id: term.id })}
                tabIndex={-1}
                className={revealTargetClassName}
              >
                <ExamTermCard
                  term={term}
                  action={
                    <ExamRegistrationButton institutionId={institutionId} term={term} />
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
