'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  useNow,
  useTimeZone,
} from 'next-intl';

import { institutionConfigurationQueries } from '../api/institution-configuration-queries';

/**
 * Every time on an institution's screens is read on that institution's clock,
 * whatever zone the reader or the server is in. Read from the configuration the
 * institution frame loads anyway. Until it answers,
 * the surrounding zone stands in.
 */
export function InstitutionTimeZone({
  institutionId,
  children,
}: {
  institutionId: string;
  children: ReactNode;
}) {
  const locale = useLocale();
  const messages = useMessages();
  const now = useNow();
  const surrounding = useTimeZone();
  const { data: timeZone } = useQuery({
    ...institutionConfigurationQueries.detail({ path: { institutionId } }),
    select: configuration => configuration.timezone,
  });

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      now={now}
      timeZone={timeZone ?? surrounding}
    >
      {children}
    </NextIntlClientProvider>
  );
}
