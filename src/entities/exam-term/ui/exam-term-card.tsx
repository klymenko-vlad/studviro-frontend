import type { ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import { Badge, ListingCard, ListingNote } from '@/shared/ui';

import {
  examRegistrationLabel,
  examSeatsLabelKey,
  recordedSeat,
  type ExamTerm,
} from '../model/exam-term';
import { examTermBlockedNote } from '../model/exam-term-filter';

export function ExamTermCard({
  term,
  href,
  action,
}: {
  term: ExamTerm;
  href?: string;
  action?: ReactNode;
}) {
  const t = useTranslations('exams');
  const format = useFormatter();
  const blocked = examTermBlockedNote(term);
  const seat = recordedSeat(term);

  return (
    <ListingCard
      interactive={href !== undefined}
      dimmed={term.isCancelled}
      action={action}
      code={term.course.code}
      header={
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-medium">
            {format.dateTime(new Date(term.startsAt), {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </p>
          {term.endsAt === null ? null : (
            <p className="text-muted-foreground text-xs">
              {t('until', {
                time: format.dateTime(new Date(term.endsAt), { timeStyle: 'short' }),
              })}
            </p>
          )}
        </div>
      }
      title={
        href === undefined ? (
          term.course.title
        ) : (
          <Link href={href} className="stretched-link">
            {term.course.title}
          </Link>
        )
      }
      badges={
        <>
          <Badge variant="secondary">{t(`kind.${term.kind}`)}</Badge>

          {term.attendance === 'teaching' ? (
            <Badge variant="outline">{t('attendance.teaching')}</Badge>
          ) : null}

          {seat === null ? null : (
            <Badge variant={seat === 'registered' ? 'default' : 'secondary'}>
              {t(`seat.${seat}`)}
            </Badge>
          )}

          {term.myRegistration?.status === 'cancelled' ? (
            <Badge variant="outline">{t('cancelledRegistration')}</Badge>
          ) : null}

          {term.isCancelled ? (
            <Badge variant="destructive">{t('cancelled')}</Badge>
          ) : null}
        </>
      }
    >
      <ListingNote>
        {term.room === null
          ? t('noRoom')
          : term.room.building === null
            ? t('room', { room: term.room.code })
            : t('roomIn', { room: term.room.code, building: term.room.building })}
      </ListingNote>

      <ListingNote>
        {term.examiner === null
          ? t('noExaminer')
          : t('examiner', { examiner: term.examiner.displayName })}
      </ListingNote>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <p className="text-muted-foreground">
          {t(examSeatsLabelKey(term), {
            seats: term.seatsRemaining ?? 0,
            capacity: term.capacity ?? 0,
          })}
        </p>
        <ExamRegistrationNote term={term} />
      </div>

      {blocked === null ? null : <ListingNote>{t(`blocked.${blocked}`)}</ListingNote>}
    </ListingCard>
  );
}

function ExamRegistrationNote({ term }: { term: ExamTerm }) {
  const t = useTranslations('exams');
  const format = useFormatter();
  const label = examRegistrationLabel(term);

  return (
    <p className="text-muted-foreground">
      {'date' in label
        ? t(`registration.${label.key}`, {
            date: format.dateTime(new Date(label.date), {
              day: 'numeric',
              month: 'short',
            }),
          })
        : t(`registration.${label.key}`)}
    </p>
  );
}
