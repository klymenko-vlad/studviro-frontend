'use client';

import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTimeZone, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { plannerMutations, type PersonalTask } from '@/entities/planner';
import { toApiError } from '@/shared/api';
import { DEFAULT_TIME_ZONE } from '@/shared/config';
import { useZodResolver } from '@/shared/lib';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@/shared/ui';

import {
  EMPTY_TASK,
  taskFormSchema,
  toTaskPayload,
  toTaskValues,
  type TaskFormValues,
} from '../model/schema';
import { useRefreshPlanner } from '../model/use-refresh-planner';
import { DeleteConfirmation } from './delete-confirmation';

export function TaskDialog({
  institutionId,
  task,
  open,
  onOpenChange,
}: {
  institutionId: string;
  task?: PersonalTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('planner');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task === undefined ? t('newTask') : t('editTask')}</DialogTitle>
          <DialogDescription>{t('privateHint')}</DialogDescription>
        </DialogHeader>
        <TaskForm
          institutionId={institutionId}
          task={task}
          onDone={() => {
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({
  institutionId,
  task,
  onDone,
}: {
  institutionId: string;
  task?: PersonalTask;
  onDone: () => void;
}) {
  const t = useTranslations('planner');
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const refresh = useRefreshPlanner();
  const form = useForm<TaskFormValues>({
    resolver: useZodResolver(taskFormSchema),
    defaultValues: task === undefined ? EMPTY_TASK : toTaskValues(task, timeZone),
  });

  const settle = (message: string) => async () => {
    toast.success(message);
    await refresh();
    onDone();
  };
  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };

  const create = useMutation({
    ...plannerMutations.createTask(),
    onSuccess: settle(t('taskCreated')),
    onError,
  });
  const update = useMutation({
    ...plannerMutations.updateTask(),
    onSuccess: settle(t('taskSaved')),
    onError,
  });
  const remove = useMutation({
    ...plannerMutations.removeTask(),
    onSuccess: settle(t('taskDeleted')),
    onError,
  });
  const busy = create.isPending || update.isPending;

  const onSubmit = form.handleSubmit(values => {
    const body = toTaskPayload(values, timeZone);
    if (task === undefined) create.mutate({ path: { institutionId }, body });
    else update.mutate({ path: { institutionId, taskId: task.id }, body });
  });

  return (
    <Form {...form} schema={taskFormSchema}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('titleLabel')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dueAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dueAtLabel')}</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormDescription>{t('dueAtHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('noteLabel')}</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="flex-wrap gap-2">
          {task === undefined ? null : (
            <DeleteConfirmation
              question={t('confirmDeleteTask')}
              pending={remove.isPending}
              onConfirm={() => {
                remove.mutate({ path: { institutionId, taskId: task.id } });
              }}
            />
          )}
          <Button type="button" variant="ghost" onClick={onDone}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {task === undefined ? t('create') : t('save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
