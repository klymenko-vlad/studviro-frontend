import { useLocale } from 'next-intl';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type DueUnit = 'minute' | 'hour' | 'day' | 'week' | 'month';

function relativeDue(target: Date, now: Date): { value: number; unit: DueUnit } {
  const diff = target.getTime() - now.getTime();
  const size = Math.abs(diff);

  if (size < HOUR) return { value: Math.round(diff / MINUTE), unit: 'minute' };
  if (size < DAY) return { value: Math.round(diff / HOUR), unit: 'hour' };

  const days = Math.round(diff / DAY);

  if (Math.abs(days) < 14) return { value: days, unit: 'day' };
  if (Math.abs(days) < 60) return { value: Math.round(days / 7), unit: 'week' };

  return { value: Math.round(days / 30), unit: 'month' };
}

export function useRelativeDue(now: Date): (iso: string) => string {
  const locale = useLocale();
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  return iso => {
    const { value, unit } = relativeDue(new Date(iso), now);

    return format.format(value, unit);
  };
}
