'use client';

import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { DEFAULT_TIME_ZONE } from '@/shared/config';
import { Badge } from '@/shared/ui';

import type { Availability } from '../model/availability';

export function AvailabilityNote({
  item,
  audience,
}: {
  item: Availability;
  audience: 'author' | 'student';
}) {
  const t = useTranslations('availability');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const when = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    });

  const note = noteOf(item);
  if (note === null) return null;

  if (audience === 'student') {
    if (note.key !== 'scheduled' && note.key !== 'until') return null;

    return (
      <p className="text-muted-foreground text-sm">
        {t(note.key === 'scheduled' ? 'opensOn' : 'availableUntil', {
          when: when(note.at),
        })}
      </p>
    );
  }

  return (
    <Badge variant="outline">{t(`badge.${note.key}`, { when: when(note.at) })}</Badge>
  );
}

interface Note {
  key: 'scheduled' | 'scheduledHidden' | 'ended' | 'until';
  at: string;
}

function noteOf(item: Availability): Note | null {
  if (item.availability === 'scheduled' && item.availableFrom !== null) {
    return {
      key: item.hiddenUntilAvailable ? 'scheduledHidden' : 'scheduled',
      at: item.availableFrom,
    };
  }
  if (item.availability === 'ended' && item.availableUntil !== null) {
    return { key: 'ended', at: item.availableUntil };
  }
  if (item.availability === 'open' && item.availableUntil !== null) {
    return { key: 'until', at: item.availableUntil };
  }

  return null;
}
