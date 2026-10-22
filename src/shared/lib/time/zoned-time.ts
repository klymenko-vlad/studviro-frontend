export interface WallTime {
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:mm` */
  time: string;
}

/**
 * The instant a clock in `timeZone` shows `date` `time`. A time skipped by a
 * spring-forward change lands after the gap, as a wall clock would; a time
 * repeated in autumn takes its first occurrence.
 */
export function wallTimeToInstant(date: string, time: string, timeZone: string): string {
  const asUtc = Date.parse(`${date}T${time}:00.000Z`);
  const before = asUtc - offsetMs(asUtc - HALF_DAY_MS, timeZone);
  const after = asUtc - offsetMs(asUtc + HALF_DAY_MS, timeZone);
  const matching = [before, after].filter(
    candidate => toWallTimeKey(candidate, timeZone) === `${date}T${time}`,
  );

  return new Date(matching.length > 0 ? Math.min(...matching) : before).toISOString();
}

export function toWallTime(iso: string, timeZone: string): WallTime {
  const [date = '', time = ''] = toWallTimeKey(Date.parse(iso), timeZone).split('T');

  return { date, time };
}

const HALF_DAY_MS = 12 * 60 * 60 * 1000;

function offsetMs(instant: number, timeZone: string): number {
  return (
    Date.parse(`${toWallTimeKey(instant, timeZone)}:00.000Z`) - floorToMinute(instant)
  );
}

function floorToMinute(instant: number): number {
  return instant - (((instant % 60_000) + 60_000) % 60_000);
}

function toWallTimeKey(instant: number, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(instant))
      .map(part => [part.type, part.value]),
  ) as Record<string, string>;

  return `${parts['year']}-${parts['month']}-${parts['day']}T${parts['hour']}:${parts['minute']}`;
}
