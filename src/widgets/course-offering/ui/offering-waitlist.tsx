'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { courseRosterQueries } from '@/entities/course-roster';
import {
  courseWaitlistMutations,
  courseWaitlistQueries,
  type WaitingStudent,
  type WaitlistDecision,
} from '@/entities/course-waitlist';
import { usePermissions } from '@/entities/permission';
import { toApiError } from '@/shared/api';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
} from '@/shared/ui';

export function OfferingWaitlist({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('courseWaitlist');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const { can } = usePermissions(institutionId);
  const manageable = can('enrollment:manage');
  const path = { institutionId, offeringId };

  const waiting = useQuery({
    ...courseWaitlistQueries.list({ path }),
    enabled: manageable,
  });

  const decide = useMutation({
    ...courseWaitlistMutations.decide(),
    onSuccess: async (_, { path: decided, body }) => {
      const student = waiting.data?.find(
        entry => entry.enrollmentId === decided.enrollmentId,
      );
      toast.success(
        t(body.status === 'active' ? 'admitted' : 'refused', {
          student: student?.displayName ?? '',
        }),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: courseWaitlistQueries.listKey({ path }),
        }),
        queryClient.invalidateQueries({
          queryKey: courseRosterQueries.detailKey({ path }),
        }),
      ]);
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  if (!manageable) return null;

  const answer = (entry: WaitingStudent, status: WaitlistDecision) => {
    decide.mutate({
      path: { ...path, enrollmentId: entry.enrollmentId },
      body: { status },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        {waiting.isPending ? (
          <ListSkeleton items={2} data-testid="offering-waitlist-loading" />
        ) : waiting.isError ? (
          <p className="text-muted-foreground">{t('error')}</p>
        ) : waiting.data.length === 0 ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <ol className="divide-border flex flex-col divide-y" aria-label={t('title')}>
            {waiting.data.map(entry => (
              <li
                key={entry.enrollmentId}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{entry.displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {entry.waitlistedAt === null
                      ? entry.email
                      : t('since', {
                          date: format.dateTime(new Date(entry.waitlistedAt), {
                            day: 'numeric',
                            month: 'short',
                          }),
                        })}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    disabled={decide.isPending}
                    aria-label={t('admitNamed', { student: entry.displayName })}
                    onClick={() => {
                      answer(entry, 'active');
                    }}
                  >
                    {t('admit')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={decide.isPending}
                    aria-label={t('refuseNamed', { student: entry.displayName })}
                    onClick={() => {
                      answer(entry, 'rejected');
                    }}
                  >
                    {t('refuse')}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
