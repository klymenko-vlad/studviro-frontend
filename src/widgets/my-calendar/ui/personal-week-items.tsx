import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';

import type { PersonalEvent, PersonalTask } from '@/entities/planner';
import { cn, toWallTime } from '@/shared/lib';

export function PersonalBlock({
  event,
  style,
  timeZone,
  onOpen,
}: {
  event: PersonalEvent;
  style: CSSProperties;
  timeZone: string;
  onOpen: () => void;
}) {
  const t = useTranslations('planner');
  const from = toWallTime(event.startsAt, timeZone).time;
  const to = toWallTime(event.endsAt, timeZone).time;
  const label = [t('personal'), event.title, `${from}–${to}`, event.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      style={style}
      title={label}
      aria-label={label}
      onClick={onOpen}
      className="bg-muted/70 border-muted-foreground/40 hover:ring-ring/40 focus-visible:ring-ring/60 absolute flex flex-col overflow-hidden rounded-md border border-l-[3px] border-dashed px-1.5 py-1 text-left text-[11px] leading-tight shadow-xs transition-shadow duration-300 outline-none hover:z-20 hover:shadow-md hover:ring-1 focus-visible:z-20 focus-visible:ring-2"
    >
      <span className="truncate font-semibold">{event.title}</span>
      <span className="text-muted-foreground truncate tabular-nums">
        {from}
        {event.location === null ? '' : ` · ${event.location}`}
      </span>
    </button>
  );
}

export function TaskChip({
  task,
  timeZone,
  onOpen,
}: {
  task: PersonalTask;
  timeZone: string;
  onOpen: () => void;
}) {
  const t = useTranslations('planner');

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('editNamed', { title: task.title })}
      className={cn(
        'bg-muted/70 hover:ring-ring/40 focus-visible:ring-ring/60 flex w-full items-center gap-1 rounded border border-dashed px-1.5 py-0.5 text-left text-[11px] leading-tight transition-shadow duration-300 outline-none hover:ring-1 focus-visible:ring-2',
      )}
    >
      <span
        className="border-muted-foreground size-1.5 shrink-0 rounded-full border"
        aria-hidden
      />
      <span className="truncate font-medium">{task.title}</span>
      {task.dueAt === null ? null : (
        <span className="text-muted-foreground ml-auto shrink-0 tabular-nums">
          {toWallTime(task.dueAt, timeZone).time}
        </span>
      )}
    </button>
  );
}
