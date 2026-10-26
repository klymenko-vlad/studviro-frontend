'use client';

import { useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { plannerMutations, type PersonalTask } from '@/entities/planner';
import { toApiError } from '@/shared/api';
import { cn } from '@/shared/lib';

import { useRefreshPlanner } from '../model/use-refresh-planner';

export function TaskDoneToggle({
  institutionId,
  task,
}: {
  institutionId: string;
  task: PersonalTask;
}) {
  const t = useTranslations('planner');
  const refresh = useRefreshPlanner();
  const toggle = useMutation({
    ...plannerMutations.updateTask(),
    onSuccess: async updated => {
      toast.success(updated.done ? t('taskDone') : t('taskReopened'));
      await refresh();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <button
      type="button"
      aria-pressed={task.done}
      aria-label={
        task.done
          ? t('markOpen', { title: task.title })
          : t('markDone', { title: task.title })
      }
      disabled={toggle.isPending}
      onClick={() => {
        toggle.mutate({
          path: { institutionId, taskId: task.id },
          body: { done: !task.done },
        });
      }}
      className={cn(
        'focus-visible:ring-ring/50 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 outline-none focus-visible:ring-[3px] disabled:opacity-60',
        task.done
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-muted-foreground/50 hover:border-primary',
      )}
    >
      {task.done ? <Check className="size-3.5" aria-hidden /> : null}
    </button>
  );
}
