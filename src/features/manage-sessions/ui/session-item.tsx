'use client';

import { Laptop, LoaderCircle } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import type { SessionDto } from '@/shared/api';
import { Badge, Button } from '@/shared/ui';

import { describeDevice } from '../model/device';

export function SessionItem({
  session,
  revoking,
  onRevoke,
}: {
  session: SessionDto;
  revoking: boolean;
  onRevoke: () => void;
}) {
  const t = useTranslations('accountSettings.sessions');
  const format = useFormatter();
  const { browser, system } = describeDevice(session.userAgent);

  const device =
    browser && system
      ? t('device', { browser, system })
      : (browser ?? system ?? t('unknownDevice'));

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex items-start gap-3">
        <Laptop aria-hidden className="text-muted-foreground mt-0.5 size-5 shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            {device}
            {session.current ? (
              <Badge variant="secondary">{t('thisDevice')}</Badge>
            ) : null}
          </span>
          <span className="text-muted-foreground text-sm">
            {t('activity', {
              signedIn: format.dateTime(new Date(session.signedInAt), {
                dateStyle: 'medium',
              }),
              lastActive: format.relativeTime(new Date(session.lastActiveAt)),
            })}
          </span>
        </div>
      </div>

      {session.current ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={revoking}
          onClick={onRevoke}
          aria-label={t('signOutDevice', { device })}
        >
          {revoking ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {t('signOut')}
        </Button>
      )}
    </li>
  );
}
