'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { ExamTermActions, ExamTermForm } from '@/features/manage-exam-terms';
import { offeringItemAnchor } from '@/entities/course-offering';
import {
  isCancelled,
  offeringExamTermQueries,
  type OfferingExamTerm,
} from '@/entities/offering-exam-term';
import { usePermissions } from '@/entities/permission';
import { cn, revealTargetClassName, useRevealHashTarget } from '@/shared/lib';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
} from '@/shared/ui';

import { OfferingExamRegistrants } from './offering-exam-registrants';

export function OfferingExamTerms({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('examTermAdmin');
  const format = useFormatter();
  // The institution's zone, so this panel and the week calendar agree about
  // when an exam is.
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { can } = usePermissions(institutionId);
  const readable = can('schedule:read');
  const manageable = can('schedule:manage');
  const marksExams = can('grade:publish');

  const terms = useQuery({
    ...offeringExamTermQueries.list({ path: { institutionId, offeringId } }),
    enabled: readable,
  });
  useRevealHashTarget(terms.isSuccess);

  if (!readable) return null;

  const day = (iso: string) =>
    format.dateTime(new Date(iso), { day: 'numeric', month: 'short', timeZone });
  const clock = (iso: string) =>
    format.dateTime(new Date(iso), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    });

  const when = (term: OfferingExamTerm) =>
    term.endsAt === null
      ? t('whenOpenEnded', { day: day(term.startsAt), from: clock(term.startsAt) })
      : t('when', {
          day: day(term.startsAt),
          from: clock(term.startsAt),
          to: clock(term.endsAt),
        });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {manageable ? (
          <ExamTermForm institutionId={institutionId} offeringId={offeringId} />
        ) : null}

        {terms.isPending ? (
          <ListSkeleton items={2} data-testid="offering-exam-terms-loading" />
        ) : terms.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : terms.data.length === 0 ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <ul className="flex flex-col gap-5" aria-label={t('title')}>
            {terms.data.map(term => (
              <li
                key={term.id}
                id={offeringItemAnchor({ kind: 'exam-term', id: term.id })}
                tabIndex={-1}
                className={cn('flex flex-col gap-2', revealTargetClassName)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-medium ${
                      isCancelled(term) ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {when(term)}
                  </span>
                  <Badge variant="secondary">{t(`kind.${term.kind}`)}</Badge>
                  <Badge variant="outline">{term.roomCode ?? t('field.noRoom')}</Badge>
                  <Badge variant="outline">
                    {term.examinerName ?? t('field.noExaminer')}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {term.capacity === null
                      ? t('seatsUnlimited', { taken: term.seatsTaken })
                      : t('seats', { taken: term.seatsTaken, capacity: term.capacity })}
                  </span>
                  {isCancelled(term) ? (
                    <Badge variant="destructive">{t('cancelledBadge')}</Badge>
                  ) : null}
                </div>

                <p className="text-muted-foreground text-xs">
                  {term.registrationOpensAt === null && term.registrationClosesAt === null
                    ? t('windowUntilExamStarts')
                    : t('window', {
                        opens:
                          term.registrationOpensAt === null
                            ? t('windowAlways')
                            : day(term.registrationOpensAt),
                        closes:
                          term.registrationClosesAt === null
                            ? t('windowUntilExam')
                            : day(term.registrationClosesAt),
                      })}
                </p>

                {manageable ? (
                  <ExamTermActions
                    institutionId={institutionId}
                    offeringId={offeringId}
                    term={term}
                    label={when(term)}
                  />
                ) : null}

                {marksExams && !isCancelled(term) ? (
                  <OfferingExamRegistrants
                    institutionId={institutionId}
                    offeringId={offeringId}
                    term={term}
                    label={when(term)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
