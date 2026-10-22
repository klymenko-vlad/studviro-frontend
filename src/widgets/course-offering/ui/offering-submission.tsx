'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { SubmissionFileDownload, SubmissionForm } from '@/features/submit-assignment';
import type { Assignment } from '@/entities/assignment';
import { attemptsLeft, submissionQueries } from '@/entities/submission';
import { Badge, Separator, Skeleton } from '@/shared/ui';

/**
 * The student's own work and nothing else: the endpoint behind it is
 * `/submissions/mine`, which takes no user id and answers only for the caller.
 * Lateness is `isLate` as the server wrote it at the moment of submission —
 * never a comparison made here against a clock the submitter controls.
 */
export function OfferingSubmission({
  institutionId,
  assignment,
}: {
  institutionId: string;
  assignment: Assignment;
}) {
  const t = useTranslations('submissions');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const submissions = useQuery(
    submissionQueries.mine({ path: { institutionId, assignmentId: assignment.id } }),
  );

  if (submissions.isPending)
    return <Skeleton className="h-16 w-full" data-testid="offering-submission-loading" />;

  if (submissions.isError)
    return <p className="text-muted-foreground text-sm">{t('error')}</p>;

  const left = attemptsLeft(submissions.data, assignment.maxAttempts);

  return (
    <div className="border-border/60 flex flex-col gap-3 rounded-md border p-4">
      <h3 className="text-sm font-medium">{t('title')}</h3>

      {submissions.data.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('none')}</p>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={t('title')}>
          {submissions.data.map(submission => (
            <li key={submission.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">
                  {t('attempt', { attempt: submission.attempt })}
                </span>
                <Badge variant="secondary">{t(`state.${submission.state}`)}</Badge>
                {submission.isLate ? (
                  <Badge variant="destructive">{t('late')}</Badge>
                ) : (
                  <Badge variant="outline">{t('onTime')}</Badge>
                )}
                <span className="text-muted-foreground">
                  {submission.submittedAt === null
                    ? t('notHandedIn')
                    : t('handedInOn', {
                        on: format.dateTime(new Date(submission.submittedAt), {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                          timeZone,
                        }),
                      })}
                </span>
              </div>

              {submission.notes === null ? null : (
                <p className="text-muted-foreground text-sm">{submission.notes}</p>
              )}

              {submission.mark === null ? null : (
                <div className="flex flex-col gap-1 text-sm">
                  <p className="font-medium">
                    {submission.mark.points === null
                      ? t('markNoPoints')
                      : submission.mark.maxPoints === null
                        ? t('markNoMaximum', { points: submission.mark.points })
                        : t('mark', {
                            points: submission.mark.points,
                            maxPoints: submission.mark.maxPoints,
                          })}
                  </p>
                  {submission.mark.feedback === null ? null : (
                    <figure className="flex flex-col gap-1">
                      <figcaption className="text-muted-foreground text-xs">
                        {t('feedback')}
                      </figcaption>
                      <blockquote className="border-border border-l-2 pl-3 whitespace-pre-line">
                        {submission.mark.feedback}
                      </blockquote>
                    </figure>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {submission.files.map(file => (
                  <SubmissionFileDownload
                    key={file.id}
                    institutionId={institutionId}
                    assignmentId={assignment.id}
                    submissionId={submission.id}
                    fileId={file.id}
                    filename={file.filename}
                    scanStatus={file.scanStatus}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Separator />

      {left === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t('noAttemptsLeft', { count: assignment.maxAttempts ?? 0 })}
        </p>
      ) : (
        <>
          {left === null ? null : (
            <p className="text-muted-foreground text-sm">
              {t('attemptsLeft', { count: left })}
            </p>
          )}
          <SubmissionForm
            institutionId={institutionId}
            assignmentId={assignment.id}
            resubmit={submissions.data.length > 0}
          />
        </>
      )}
    </div>
  );
}
