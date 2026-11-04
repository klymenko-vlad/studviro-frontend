import { toWallTime } from '@/shared/lib';

import type { CalendarItem } from './calendar-items';

const DEFAULT_FIRST_HOUR = 8;
const DEFAULT_LAST_HOUR = 18;
const EXAM_WITHOUT_END_MINUTES = 90;

export interface WeekBlock {
  item: CalendarItem;
  /** Minutes after midnight on the institution's clock. */
  start: number;
  end: number;
  /** Which of `lanes` side-by-side slots it takes, when it overlaps others. */
  lane: number;
  lanes: number;
}

interface WeekColumn {
  key: string;
  blocks: WeekBlock[];
  /** Things that happen at an instant rather than over hours: deadlines. */
  allDay: CalendarItem[];
}

export interface WeekLayout {
  columns: WeekColumn[];
  firstHour: number;
  lastHour: number;
}

/**
 * The week as a grid: one column per day, each class and exam a block spanning
 * its own minutes, overlapping blocks split side by side. Hours are read on the
 * institution's clock, so a 09:00 class sits at 09:00 wherever it is viewed.
 */
export function layoutWeek(
  items: CalendarItem[],
  dayKeys: string[],
  timeZone: string,
): WeekLayout {
  const columns: WeekColumn[] = dayKeys.map(key => ({ key, blocks: [], allDay: [] }));
  const byKey = new Map(columns.map(column => [column.key, column]));

  for (const item of items) {
    const at = toWallTime(item.startsAt, timeZone);
    const column = byKey.get(at.date);
    if (column === undefined) continue;

    if (item.kind === 'deadline' || item.kind === 'task') {
      column.allDay.push(item);
      continue;
    }

    const start = minutesOf(at.time);
    const endsAt =
      item.kind === 'event' || item.kind === 'personal'
        ? item.event.endsAt
        : item.term.endsAt;
    const end =
      endsAt === null
        ? start + EXAM_WITHOUT_END_MINUTES
        : sameDayEnd(start, toWallTime(endsAt, timeZone), at.date);

    column.blocks.push({ item, start, end, lane: 0, lanes: 1 });
  }

  for (const column of columns) assignLanes(column.blocks);

  const blocks = columns.flatMap(column => column.blocks);
  const firstHour = Math.min(
    DEFAULT_FIRST_HOUR,
    ...blocks.map(block => Math.floor(block.start / 60)),
  );
  const lastHour = Math.max(
    DEFAULT_LAST_HOUR,
    ...blocks.map(block => Math.ceil(block.end / 60)),
  );

  return { columns, firstHour, lastHour };
}

function minutesOf(time: string): number {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

/** A block that runs past midnight is drawn to the end of its first day. */
function sameDayEnd(start: number, end: { date: string; time: string }, day: string) {
  const minutes = end.date === day ? minutesOf(end.time) : 24 * 60;
  return Math.max(minutes, start + 15);
}

function assignLanes(blocks: WeekBlock[]): void {
  blocks.sort((left, right) => left.start - right.start || right.end - left.end);

  let cluster: WeekBlock[] = [];
  let clusterEnd = -1;
  const close = () => {
    const lanes = Math.max(1, ...cluster.map(block => block.lane + 1));
    for (const block of cluster) block.lanes = lanes;
    cluster = [];
  };

  for (const block of blocks) {
    if (block.start >= clusterEnd && cluster.length > 0) close();

    const taken = new Set(
      cluster.filter(other => other.end > block.start).map(other => other.lane),
    );
    let lane = 0;
    while (taken.has(lane)) lane += 1;
    block.lane = lane;

    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, block.end);
  }
  if (cluster.length > 0) close();
}
