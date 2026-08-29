import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import { Badge, Card, CardContent } from '@/shared/ui';

import {
  examRegistrationLabel,
  examSeatsLabelKey,
  isRegistered,
  type ExamTerm,
} from '../model/exam-term';

export function ExamTermCard({ term, href }: { term: ExamTerm; href?: string }) {
  const t = useTranslations('exams');
  const format = useFormatter();

  return (
    <Card className={term.isCancelled ? 'opacity-70' : undefined}>
      <CardContent className="flex flex-col gap-2 py-4">
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

        <h3 className="text-base leading-tight font-semibold">
          {href === undefined ? (
            term.course.title
          ) : (
            <Link href={href} className="hover:underline focus-visible:underline">
              {term.course.title}
            </Link>
          )}
        </h3>

        <p className="text-muted-foreground font-mono text-xs">{term.course.code}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t(`kind.${term.kind}`)}</Badge>

          {term.attendance === 'teaching' ? (
            <Badge variant="outline">{t('attendance.teaching')}</Badge>
          ) : null}

          {isRegistered(term) ? <Badge>{t('registered')}</Badge> : null}

          {term.isCancelled ? (
            <Badge variant="destructive">{t('cancelled')}</Badge>
          ) : null}
        </div>

        <p className="text-muted-foreground text-sm">
          {term.room === null
            ? t('noRoom')
            : term.room.building === null
              ? t('room', { room: term.room.code })
              : t('roomIn', { room: term.room.code, building: term.room.building })}
        </p>

        <p className="text-muted-foreground text-sm">
          {term.examiner === null
            ? t('noExaminer')
            : t('examiner', { examiner: term.examiner.displayName })}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
          <p className="text-muted-foreground">
            {t(examSeatsLabelKey(term), {
              seats: term.seatsRemaining ?? 0,
              capacity: term.capacity ?? 0,
            })}
          </p>
          <ExamRegistrationNote term={term} />
        </div>
      </CardContent>
    </Card>
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
