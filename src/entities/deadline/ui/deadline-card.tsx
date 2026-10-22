import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import { Badge, Card, CardContent } from '@/shared/ui';

import { deadlineState, type Deadline } from '../model/deadline';

export function DeadlineCard({ deadline, href }: { deadline: Deadline; href?: string }) {
  const t = useTranslations('deadlines');
  const format = useFormatter();
  const state = deadlineState(deadline);
  const { submission } = deadline;

  return (
    <Card
      interactive={href !== undefined}
      className={state === 'overdue' || state === 'handedIn' ? 'py-1 opacity-70' : 'py-1'}
    >
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-medium">
            {t('dueAt', {
              time: format.dateTime(new Date(deadline.dueAt), { timeStyle: 'short' }),
            })}
          </p>
          <Badge variant={state === 'missed' ? 'destructive' : 'secondary'}>
            {t(`state.${state}`)}
          </Badge>
        </div>

        {/*
          The name used to link out to Moodle. StudViro owns the activity now
          and there is nowhere external to go, so it is plain text — the course
          title below already links to the offering the work belongs to, and
          two links to the same place is one too many.
        */}
        <h3 className="text-base leading-tight font-semibold">{deadline.name}</h3>

        <p className="text-sm">
          {href === undefined ? (
            deadline.course.title
          ) : (
            <Link href={href} className="stretched-link">
              {deadline.course.title}
            </Link>
          )}
        </p>

        <p className="text-muted-foreground font-mono text-xs">{deadline.course.code}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t(`type.${deadline.type}`)}</Badge>
          {deadline.attendance === 'teaching' ? (
            <Badge variant="outline">{t('attendance.teaching')}</Badge>
          ) : null}
        </div>

        {submission === null ? null : (
          <p className="text-sm">
            {t(submission.isLate ? 'submission.handedInLate' : 'submission.handedIn', {
              when:
                submission.submittedAt === null
                  ? t(`submission.state.${submission.state}`)
                  : format.dateTime(new Date(submission.submittedAt), {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }),
            })}
          </p>
        )}

        <p className="text-muted-foreground text-sm">
          {t('inSpace', { space: deadline.learningSpace.name })}
        </p>
      </CardContent>
    </Card>
  );
}
