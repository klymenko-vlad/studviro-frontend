'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { dueDate, isUnlinked, learningSpaceQueries } from '@/entities/learning-space';
import { toApiError } from '@/shared/api';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

export function LearningSpaces({ institutionId }: { institutionId: string }) {
  const t = useTranslations('learning');
  const format = useFormatter();
  const { data, isPending, error } = useQuery(
    learningSpaceQueries.list({ path: { institutionId } }),
  );

  if (isPending)
    return <Skeleton className="h-64 w-full" data-testid="learning-loading" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>
          {t('errorDescription', { status: toApiError(error).status })}
        </AlertDescription>
      </Alert>
    );
  }

  if (data.total === 0) {
    return (
      <Alert>
        <AlertTitle>{t('emptyTitle')}</AlertTitle>
        <AlertDescription>{t('emptyDescription')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('summaryTitle')}</CardTitle>
          <CardDescription>
            {t('summary', { total: data.total, linked: data.linked })}
          </CardDescription>
        </CardHeader>
        {data.unlinked > 0 ? (
          <CardContent>
            <Alert>
              <AlertTitle>{t('unlinkedTitle')}</AlertTitle>
              <AlertDescription>
                {t('unlinkedDescription', { unlinked: data.unlinked })}
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : null}
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('column.space')}</TableHead>
            <TableHead>{t('column.offering')}</TableHead>
            <TableHead>{t('column.activities')}</TableHead>
            <TableHead>{t('column.nextDue')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.spaces.map(space => {
            const due = dueDate(space);

            return (
              <TableRow key={space.id}>
                <TableCell>
                  {space.name}
                  <span className="text-muted-foreground block text-xs">
                    {space.shortName ?? t('none')}
                  </span>
                </TableCell>
                <TableCell>
                  {isUnlinked(space) ? (
                    <Badge variant="outline">{t('unlinkedBadge')}</Badge>
                  ) : (
                    <>
                      {space.courseTitle ?? t('none')}
                      <span className="text-muted-foreground block text-xs">
                        {space.courseCode ?? t('none')} · {space.termCode ?? t('none')}
                      </span>
                    </>
                  )}
                </TableCell>
                <TableCell>{space.activityCount}</TableCell>
                <TableCell>
                  {due === null
                    ? t('none')
                    : format.dateTime(due, { dateStyle: 'medium', timeStyle: 'short' })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
