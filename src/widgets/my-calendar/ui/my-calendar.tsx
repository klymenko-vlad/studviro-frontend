'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import {
  ALL_COURSES,
  ChoiceFilter,
  CourseFilter,
  courseFilterOptions,
  offeringFilterValue,
  ScheduleFilters,
  ToggleFilter,
} from '@/features/filter-schedule';
import { deadlineQueries } from '@/entities/deadline';
import { examTermQueries } from '@/entities/exam-term';
import {
  addDays,
  addWeeks,
  dayKey,
  startOfWeek,
  timetableEventQueries,
  type TimetableEventType,
} from '@/entities/timetable-event';
import { usePathname, useRouter, useSearchParams } from '@/shared/config';
import { cn } from '@/shared/lib';
import {
  Button,
  EmptyState,
  ListSkeleton,
  QueryError,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui';

import { groupCalendarItems } from '../model/calendar-items';
import { layoutWeek } from '../model/week-layout';
import { CalendarDaySection } from './calendar-day-section';
import { CalendarWeekGrid } from './calendar-week-grid';

type View = 'week' | 'list';

const ALL_TYPES = 'all';
const TYPES: TimetableEventType[] = [
  'lecture',
  'seminar',
  'lab',
  'consultation',
  'exam',
  'other',
];

export function MyCalendar({
  institutionId,
  today = new Date(),
}: {
  institutionId: string;
  today?: Date;
}) {
  const t = useTranslations('calendar');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [from, setFrom] = useState(() => startOfWeek(today));
  const [offering, setOffering] = useState<string>(ALL_COURSES);
  const [type, setType] = useState<string>(ALL_TYPES);
  const [showExams, setShowExams] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(true);
  const to = addWeeks(from, 1);

  // The chosen view lives in `?view=`. Until somebody chooses, a wide screen
  // gets the grid and a phone the list — seven columns do not fit a phone.
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('view');
  const view: View | null =
    requested === 'week' || requested === 'list' ? requested : null;
  const choose = (next: View) => {
    const query = new URLSearchParams(params.toString());
    query.set('view', next);
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };

  const range = { from: from.toISOString(), to: to.toISOString() };
  const offeringId = offeringFilterValue(offering);

  const { data, isPending, isError, refetch } = useQuery(
    timetableEventQueries.list({
      path: { institutionId },
      query: {
        ...range,
        offeringId,
        type: type === ALL_TYPES ? undefined : (type as TimetableEventType),
      },
    }),
  );

  const exams = useQuery({
    ...examTermQueries.list({ path: { institutionId }, query: { ...range, offeringId } }),
    enabled: showExams,
  });

  const deadlines = useQuery({
    ...deadlineQueries.list({ path: { institutionId }, query: { ...range, offeringId } }),
    enabled: showDeadlines,
  });

  const courses = useQuery({
    ...timetableEventQueries.list({ path: { institutionId }, query: range }),
    select: courseFilterOptions,
  });

  const day = { day: 'numeric', month: 'short' } as const;
  const lastDay = addDays(from, 6);
  const isThisWeek = from.getTime() === startOfWeek(today).getTime();
  const dates = { from: format.dateTime(from, day), to: format.dateTime(lastDay, day) };

  const days = groupCalendarItems(
    data ?? [],
    showExams ? (exams.data ?? []) : [],
    showDeadlines ? (deadlines.data ?? []) : [],
    timeZone,
  );
  const eventCount = days.reduce((n, d) => n + d.items.length, 0);
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(from, index));
  const week = layoutWeek(
    days.flatMap(entry => entry.items),
    weekDates.map(date => dayKey(date, timeZone)),
    timeZone,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-medium" data-testid="calendar-week">
            {t('week', dates)}
          </p>
          {isPending || isError ? null : (
            <p className="text-muted-foreground text-sm">
              {isThisWeek
                ? t('weekSummary', { events: eventCount })
                : t('eventCount', { events: eventCount })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t('viewLabel')}
            className="bg-muted mr-2 inline-flex rounded-lg p-[3px]"
          >
            {(['week', 'list'] as const).map(option => {
              const Icon = option === 'week' ? CalendarDays : List;
              const active =
                view === option
                  ? 'bg-card text-foreground shadow-sm'
                  : view === null
                    ? option === 'week'
                      ? 'md:bg-card md:text-foreground md:shadow-sm'
                      : 'max-md:bg-card max-md:text-foreground max-md:shadow-sm'
                    : '';

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={view === null ? undefined : view === option}
                  onClick={() => {
                    choose(option);
                  }}
                  className={cn(
                    'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-[color,background-color,box-shadow] duration-300 outline-none focus-visible:ring-[3px]',
                    active,
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                  {t(`view.${option}`)}
                </button>
              );
            })}
          </div>
          <div
            role="group"
            aria-label={t('weekNavigation')}
            className="bg-card divide-border inline-flex items-center divide-x overflow-hidden rounded-lg border shadow-xs"
          >
            <WeekStep
              label={t('previousWeek')}
              icon={ChevronLeft}
              onClick={() => {
                setFrom(addWeeks(from, -1));
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={isThisWeek}
              onClick={() => {
                setFrom(startOfWeek(today));
              }}
              className="disabled:text-muted-foreground rounded-none px-3 disabled:opacity-100"
            >
              {t('thisWeek')}
            </Button>
            <WeekStep
              label={t('nextWeek')}
              icon={ChevronRight}
              onClick={() => {
                setFrom(addWeeks(from, 1));
              }}
            />
          </div>
        </div>
      </div>

      <ScheduleFilters label={t('filters')}>
        <CourseFilter
          label={t('filterCourse')}
          allLabel={t('allCourses')}
          options={courses.data ?? []}
          value={offering}
          onChange={setOffering}
        />
        <ChoiceFilter
          label={t('filterType')}
          allLabel={t('allTypes')}
          allValue={ALL_TYPES}
          options={TYPES.map(value => ({ value, label: t(`type.${value}`) }))}
          value={type}
          onChange={setType}
        />
        <ToggleFilter
          label={t('showExams')}
          checked={showExams}
          onChange={setShowExams}
        />
        <ToggleFilter
          label={t('showDeadlines')}
          checked={showDeadlines}
          onChange={setShowDeadlines}
        />
      </ScheduleFilters>

      {isPending ? (
        <ListSkeleton items={3} data-testid="my-calendar-loading" />
      ) : isError ? (
        <QueryError
          onRetry={refetch}
          title={t('errorTitle')}
          description={t('errorDescription')}
        />
      ) : (
        <>
          {view === 'list' ? null : (
            <div className={cn(view === null && 'hidden md:block')}>
              <CalendarWeekGrid
                layout={week}
                days={weekDates}
                institutionId={institutionId}
                timeZone={timeZone}
              />
            </div>
          )}
          {view === 'week' ? null : (
            <div className={cn('flex flex-col gap-8', view === null && 'md:hidden')}>
              {days.length === 0 ? (
                <EmptyState
                  size="inline"
                  title={isThisWeek ? t('empty') : t('emptyWeek', dates)}
                />
              ) : (
                days.map(entry => (
                  <CalendarDaySection
                    key={entry.key}
                    day={entry}
                    institutionId={institutionId}
                    today={today}
                    timeZone={timeZone}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** One step through the weeks: an arrow that names where it goes on hover and to a screen reader. */
function WeekStep({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof ChevronLeft;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={onClick}
          className="rounded-none"
        >
          <Icon aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
