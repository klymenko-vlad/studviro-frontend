'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { TaskDialog } from '@/features/manage-planner';
import {
  plannerQueries,
  TASK_STATES,
  type PersonalTask,
  type TaskState,
} from '@/entities/planner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  ListSkeleton,
  LoadMore,
  QueryError,
  Select,
  SelectItem,
} from '@/shared/ui';

import { TaskRow } from './task-row';

export function MyTasks({
  institutionId,
  now = new Date(),
}: {
  institutionId: string;
  now?: Date;
}) {
  const t = useTranslations('planner');
  const filterId = useId();
  const statusId = useId();
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState<TaskState>('open');
  const [editing, setEditing] = useState<PersonalTask | null>(null);
  const [creating, setCreating] = useState(false);
  const q = useDeferredValue(filter.trim());

  const tasks = useInfiniteQuery({
    ...plannerQueries.tasks({
      path: { institutionId },
      query: q === '' ? { status } : { status, q },
    }),
    placeholderData: keepPreviousData,
  });
  const items = tasks.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle as="h2">{t('tasks.title')}</CardTitle>
          <CardDescription>{t('tasks.description')}</CardDescription>
        </div>
        <Button
          type="button"
          onClick={() => {
            setCreating(true);
          }}
        >
          <Plus aria-hidden />
          {t('newTask')}
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-48 flex-1 flex-col gap-1">
            <Label htmlFor={filterId}>{t('tasks.filterLabel')}</Label>
            <Input
              id={filterId}
              type="search"
              autoComplete="off"
              placeholder={t('tasks.filterPlaceholder')}
              value={filter}
              onChange={event => {
                setFilter(event.target.value);
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={statusId}>{t('tasks.statusLabel')}</Label>
            <Select
              id={statusId}
              value={status}
              onValueChange={value => {
                setStatus(TASK_STATES.find(state => state === value) ?? 'open');
              }}
            >
              {TASK_STATES.map(state => (
                <SelectItem key={state} value={state}>
                  {t(`tasks.status.${state}`)}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        {tasks.isPending ? (
          <ListSkeleton items={3} />
        ) : tasks.isError ? (
          <QueryError
            title={t('tasks.error')}
            onRetry={() => {
              void tasks.refetch();
            }}
          />
        ) : items.length === 0 ? (
          q === '' ? (
            <EmptyState size="inline" title={t('tasks.empty')} />
          ) : (
            <p className="text-muted-foreground text-sm">
              {t('tasks.noMatch', { query: q })}
            </p>
          )
        ) : (
          <ul className="-mx-2 flex flex-col" aria-label={t('tasks.listLabel')}>
            {items.map(task => (
              <li key={task.id}>
                <TaskRow
                  institutionId={institutionId}
                  task={task}
                  now={now}
                  onEdit={() => {
                    setEditing(task);
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        {tasks.hasNextPage ? (
          <LoadMore
            shown={items.length}
            hasMore={tasks.hasNextPage}
            pending={tasks.isFetchingNextPage}
            onLoadMore={() => {
              void tasks.fetchNextPage();
            }}
          />
        ) : null}
      </CardContent>

      <TaskDialog
        institutionId={institutionId}
        open={creating}
        onOpenChange={setCreating}
      />
      <TaskDialog
        key={editing?.id}
        institutionId={institutionId}
        task={editing ?? undefined}
        open={editing !== null}
        onOpenChange={open => {
          if (!open) setEditing(null);
        }}
      />
    </Card>
  );
}
