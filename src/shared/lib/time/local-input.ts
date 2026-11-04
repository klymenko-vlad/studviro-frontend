import { toWallTime, wallTimeToInstant } from './zoned-time';

export function toLocalInput(iso: string | null, timeZone: string): string {
  if (iso === null) return '';
  const { date, time } = toWallTime(iso, timeZone);

  return `${date}T${time}`;
}

export function fromLocalInput(value: string, timeZone: string): string | null {
  if (value === '') return null;
  const [date = '', time = ''] = value.split('T');

  return wallTimeToInstant(date, time.slice(0, 5), timeZone);
}
