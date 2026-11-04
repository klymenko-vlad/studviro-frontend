import { Pencil } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { TaskDoneToggle } from '@/features/manage-planner';
import type { PersonalTask } from '@/entities/planner';
import { cn } from '@/shared/lib';
import { Badge, Button } from '@/shared/ui';

export function TaskRow({
  institutionId,
  task,
  now,
  onEdit,
}: {
  institutionId: string;
  task: PersonalTask;
  now: Date;
  onEdit: () => void;
}) {
  const t = useTranslations('planner');
  const format = useFormatter();
  const overdue =
    !task.done && task.dueAt !== null && new Date(task.dueAt).getTime() < now.getTime();

  return (
    <div className="hover:bg-muted/50 flex items-start gap-3 rounded-md px-2 py-2.5">
      <TaskDoneToggle institutionId={institutionId} task={task} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn('font-medium', task.done && 'text-muted-foreground line-through')}
        >
          {task.title}
        </span>
        <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          {task.dueAt === null ? (
            t('tasks.noDue')
          ) : (
            <time dateTime={task.dueAt}>
              {t('tasks.due', {
                date: format.dateTime(new Date(task.dueAt), {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: 'numeric',
                }),
              })}
            </time>
          )}
          {overdue ? <Badge variant="destructive">{t('tasks.overdue')}</Badge> : null}
        </span>
        {task.note === null ? null : (
          <span className="text-muted-foreground line-clamp-2 text-sm">{task.note}</span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('editNamed', { title: task.title })}
        onClick={onEdit}
      >
        <Pencil aria-hidden />
      </Button>
    </div>
  );
}
