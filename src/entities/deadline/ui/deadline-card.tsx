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
      className={state === 'overdue' || state === 'handedIn' ? 'opacity-70' : undefined}
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

        <h3 className="text-base leading-tight font-semibold">
          {deadline.url === null ? (
            deadline.name
          ) : (
            <a
              href={deadline.url}
              rel="noreferrer noopener"
              target="_blank"
              className="hover:underline focus-visible:underline"
            >
              {deadline.name}
            </a>
          )}
        </h3>

        <p className="text-sm">
          {href === undefined ? (
            deadline.course.title
          ) : (
            <Link href={href} className="hover:underline focus-visible:underline">
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
