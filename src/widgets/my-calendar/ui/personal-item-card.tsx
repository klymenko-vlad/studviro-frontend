import { useFormatter, useTranslations } from 'next-intl';

import { TaskDoneToggle } from '@/features/manage-planner';
import type { PersonalEvent, PersonalTask } from '@/entities/planner';
import { Badge, Card, CardContent } from '@/shared/ui';

export function PersonalEventCard({
  event,
  onOpen,
}: {
  event: PersonalEvent;
  onOpen: () => void;
}) {
  const t = useTranslations('calendar');
  const tPlanner = useTranslations('planner');
  const format = useFormatter();
  const time = { timeStyle: 'short' } as const;

  return (
    <Card interactive className="border-dashed py-1">
      <CardContent className="flex flex-col gap-2 py-4">
        <p className="font-medium">
          {t('time', {
            from: format.dateTime(new Date(event.startsAt), time),
            to: format.dateTime(new Date(event.endsAt), time),
          })}
        </p>
        <h3 className="text-base leading-tight font-semibold">
          <button
            type="button"
            className="stretched-link text-left"
            aria-label={tPlanner('editNamed', { title: event.title })}
            onClick={onOpen}
          >
            {event.title}
          </button>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{tPlanner('personal')}</Badge>
        </div>
        {event.location === null ? null : (
          <p className="text-muted-foreground text-sm">{event.location}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PersonalTaskCard({
  institutionId,
  task,
  onOpen,
}: {
  institutionId: string;
  task: PersonalTask;
  onOpen: () => void;
}) {
  const tPlanner = useTranslations('planner');
  const format = useFormatter();

  return (
    <Card className="border-dashed py-1">
      <CardContent className="flex items-start gap-3 py-4">
        <TaskDoneToggle institutionId={institutionId} task={task} />
        <div className="flex min-w-0 flex-col gap-1">
          <button
            type="button"
            className="text-left font-semibold hover:underline"
            aria-label={tPlanner('editNamed', { title: task.title })}
            onClick={onOpen}
          >
            {task.title}
          </button>
          {task.dueAt === null ? null : (
            <time dateTime={task.dueAt} className="text-muted-foreground text-sm">
              {tPlanner('tasks.due', {
                date: format.dateTime(new Date(task.dueAt), { timeStyle: 'short' }),
              })}
            </time>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
