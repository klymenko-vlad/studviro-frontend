'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

import { courseOfferingHref } from '@/entities/course-offering';
import { dayKey, eventTitle } from '@/entities/timetable-event';
import { Link } from '@/shared/config';
import { cn, toneStyle, toWallTime } from '@/shared/lib';

import type { CalendarItem } from '../model/calendar-items';
import { deadlineHref } from '../model/deadline-href';
import type { WeekBlock, WeekLayout } from '../model/week-layout';
import { PersonalBlock, TaskChip } from './personal-week-items';

const HOUR_PX = 56;
/** Past two side by side a block is too narrow to read; the rest fan out instead. */
const SIDE_BY_SIDE = 2;
const FAN_OFFSET_PX = 14;

/**
 * The week as a calendar: a column per day, an hour per row, each class and
 * exam a block at its own time in its course's colour, deadlines in a strip
 * along the top, and a line at the current minute on today.
 */
export function CalendarWeekGrid({
  layout,
  days,
  institutionId,
  timeZone,
  onOpenPersonal,
}: {
  layout: WeekLayout;
  days: Date[];
  institutionId: string;
  timeZone: string;
  onOpenPersonal: (item: CalendarItem) => void;
}) {
  const t = useTranslations('calendar');
  const format = useFormatter();
  const now = useNow();
  const hours = Array.from(
    { length: layout.lastHour - layout.firstHour },
    (_, index) => layout.firstHour + index,
  );
  const height = hours.length * HOUR_PX;
  const todayKey = now === null ? null : dayKey(now, timeZone);
  const hasAllDay = layout.columns.some(column => column.allDay.length > 0);
  const grid = 'grid grid-cols-[3.5rem_repeat(7,minmax(6.5rem,1fr))]';

  return (
    <div
      className="bg-card overflow-x-auto rounded-xl border shadow-sm"
      data-testid="calendar-grid"
    >
      <div className="min-w-[48rem]">
        <div className={cn(grid, 'bg-card sticky top-0 z-10 border-b')}>
          <div />
          {days.map((date, index) => {
            const key = layout.columns[index]?.key;
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className="flex flex-col items-center gap-0.5 border-l py-2 text-center"
              >
                <span className="text-muted-foreground text-xs">
                  {format.dateTime(date, { weekday: 'short' })}
                </span>
                <span
                  className={cn(
                    'grid size-7 place-items-center rounded-full text-sm font-semibold tabular-nums',
                    isToday && 'bg-primary text-primary-foreground',
                  )}
                  aria-current={isToday ? 'date' : undefined}
                >
                  {format.dateTime(date, { day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>

        {hasAllDay ? (
          <div className={cn(grid, 'border-b')}>
            <div className="text-muted-foreground px-2 py-2 text-right text-[11px]">
              {t('deadlineLayer')}
            </div>
            {layout.columns.map(column => (
              <ul key={column.key} className="flex min-w-0 flex-col gap-1 border-l p-1">
                {column.allDay.map(item => (
                  <li key={item.id}>
                    <AllDayItem
                      item={item}
                      institutionId={institutionId}
                      timeZone={timeZone}
                      onOpenPersonal={onOpenPersonal}
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ) : null}

        <div className={grid}>
          <div className="relative" style={{ height }}>
            {hours.map((hour, index) => (
              <span
                key={hour}
                className="text-muted-foreground absolute right-2 -translate-y-1/2 text-[11px] tabular-nums"
                style={{ top: index * HOUR_PX }}
              >
                {index === 0 ? null : `${String(hour).padStart(2, '0')}:00`}
              </span>
            ))}
          </div>

          {layout.columns.map(column => (
            <div
              key={column.key}
              className={cn(
                'relative border-l',
                column.key === todayKey && 'bg-primary/[0.03]',
              )}
              style={{
                height,
                backgroundImage:
                  'linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
                backgroundSize: `100% ${String(HOUR_PX)}px`,
              }}
            >
              {column.blocks.map(block => (
                <Block
                  key={block.item.id}
                  block={block}
                  firstHour={layout.firstHour}
                  institutionId={institutionId}
                  timeZone={timeZone}
                  onOpenPersonal={onOpenPersonal}
                />
              ))}

              {now !== null && column.key === todayKey ? (
                <NowLine now={now} firstHour={layout.firstHour} timeZone={timeZone} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Block({
  block,
  firstHour,
  institutionId,
  timeZone,
  onOpenPersonal,
}: {
  block: WeekBlock;
  firstHour: number;
  institutionId: string;
  timeZone: string;
  onOpenPersonal: (item: CalendarItem) => void;
}) {
  const t = useTranslations('calendar');
  const { item } = block;
  const top = ((block.start - firstHour * 60) / 60) * HOUR_PX;
  const blockHeight = Math.max(((block.end - block.start) / 60) * HOUR_PX - 2, 20);
  const fanned = block.lanes > SIDE_BY_SIDE;
  const width = 100 / block.lanes;
  const placement: CSSProperties = fanned
    ? {
        left: block.lane * FAN_OFFSET_PX + 2,
        right: (block.lanes - 1 - block.lane) * FAN_OFFSET_PX + 2,
        zIndex: block.lane + 1,
      }
    : {
        left: `calc(${String(block.lane * width)}% + 2px)`,
        width: `calc(${String(width)}% - 4px)`,
      };

  if (item.kind === 'personal') {
    return (
      <PersonalBlock
        event={item.event}
        style={{ top, height: blockHeight, ...placement }}
        timeZone={timeZone}
        onOpen={() => {
          onOpenPersonal(item);
        }}
      />
    );
  }

  const course =
    item.kind === 'event'
      ? item.event.course
      : item.kind === 'exam'
        ? item.term.course
        : null;
  if (course === null) return null;

  const title = item.kind === 'event' ? eventTitle(item.event) : course.title;
  const cancelled =
    item.kind === 'event'
      ? item.event.isCancelled
      : item.kind === 'exam' && item.term.isCancelled;
  const room =
    item.kind === 'event'
      ? item.event.room?.code
      : item.kind === 'exam'
        ? item.term.room?.code
        : undefined;
  const href =
    item.kind === 'exam'
      ? courseOfferingHref(institutionId, item.term.offering.id, {
          section: 'schedule',
          item: { kind: 'exam-term', id: item.term.id },
        })
      : item.kind === 'event'
        ? courseOfferingHref(institutionId, item.event.offering.id)
        : '';
  const from = toWallTime(item.startsAt, timeZone).time;

  const style: CSSProperties = {
    ...toneStyle(course.code),
    top,
    height: blockHeight,
    ...placement,
  };
  const to =
    item.kind === 'event'
      ? toWallTime(item.event.endsAt, timeZone).time
      : item.kind === 'exam' && item.term.endsAt !== null
        ? toWallTime(item.term.endsAt, timeZone).time
        : null;
  const label = [
    item.kind === 'exam' ? `${t('examLayer')}: ${title}` : title,
    course.code,
    to === null ? from : `${from}–${to}`,
    room,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={href}
      style={style}
      title={label}
      aria-label={label}
      className={cn(
        'tone bg-tone-soft border-tone hover:ring-ring/40 focus-visible:ring-ring/60 absolute flex flex-col overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight shadow-xs transition-shadow duration-300 outline-none hover:z-20 hover:shadow-md hover:ring-1 focus-visible:z-20 focus-visible:ring-2',
        item.kind === 'exam' && 'border-dashed',
        cancelled && 'opacity-60',
      )}
    >
      <span className={cn('truncate font-semibold', cancelled && 'line-through')}>
        {item.kind === 'exam' ? `${t('examLayer')} · ${title}` : title}
      </span>
      <span className="text-muted-foreground truncate tabular-nums">
        {from}
        {room === undefined ? '' : ` · ${room}`}
      </span>
    </Link>
  );
}

function AllDayItem({
  item,
  institutionId,
  timeZone,
  onOpenPersonal,
}: {
  item: CalendarItem;
  institutionId: string;
  timeZone: string;
  onOpenPersonal: (item: CalendarItem) => void;
}) {
  if (item.kind === 'task') {
    return (
      <TaskChip
        task={item.task}
        timeZone={timeZone}
        onOpen={() => {
          onOpenPersonal(item);
        }}
      />
    );
  }
  if (item.kind !== 'deadline') return null;
  const { deadline } = item;

  return (
    <Link
      href={deadlineHref(institutionId, deadline)}
      style={toneStyle(deadline.course.code)}
      className="tone bg-tone-soft hover:ring-ring/40 focus-visible:ring-ring/60 flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-tight transition-shadow duration-300 outline-none hover:ring-1 focus-visible:ring-2"
    >
      <span className="bg-tone size-1.5 shrink-0 rounded-full" aria-hidden />
      <span className="truncate font-medium">{deadline.name}</span>
      <span className="text-muted-foreground ml-auto shrink-0 tabular-nums">
        {toWallTime(deadline.dueAt, timeZone).time}
      </span>
    </Link>
  );
}

function NowLine({
  now,
  firstHour,
  timeZone,
}: {
  now: Date;
  firstHour: number;
  timeZone: string;
}) {
  const [hours = '0', minutes = '0'] = toWallTime(now.toISOString(), timeZone).time.split(
    ':',
  );
  const top = ((Number(hours) * 60 + Number(minutes) - firstHour * 60) / 60) * HOUR_PX;
  if (top < 0) return null;

  return (
    <div
      aria-hidden
      className="bg-destructive pointer-events-none absolute inset-x-0 z-[1] h-px before:absolute before:-top-[3px] before:-left-1 before:size-[7px] before:rounded-full before:bg-inherit"
      style={{ top }}
    />
  );
}

/** The current minute, on the client only — the server's clock would not match. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => {
      setNow(new Date());
    };
    const first = window.setTimeout(tick, 0);
    const every = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, []);

  return now;
}
