'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, LoaderCircle } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { apiQueries, toApiError } from '@/shared/api';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/shared/ui';

import { calendarFeedQueries, calendarFileHref } from '../model/queries';
import { subscribeLinks, type SubscribeLinks } from '../model/subscribe-links';

export function CalendarSubscription({ institutionId }: { institutionId: string }) {
  const t = useTranslations('calendar.subscription');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const path = { institutionId };
  const status = useQuery(calendarFeedQueries.status({ path }));
  const [issuedUrl, setIssuedUrl] = useState<string | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: calendarFeedQueries.statusKey({ path }) });
  const fail = (error: unknown) => toast.error(toApiError(error).message);

  const issue = useMutation({
    ...apiQueries.issueMyCalendarFeedMutation(),
    onSuccess: async issued => {
      setIssuedUrl(issued.url);
      await refresh();
    },
    onError: fail,
  });

  const revoke = useMutation({
    ...apiQueries.revokeMyCalendarFeedMutation(),
    onSuccess: async () => {
      setIssuedUrl(null);
      toast.success(t('turnedOff'));
      await refresh();
    },
    onError: fail,
  });

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const busy = issue.isPending || revoke.isPending;
  const active = status.data?.active === true;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Button asChild variant="outline">
            <a href={calendarFileHref(institutionId)} download>
              <Download aria-hidden />
              {t('download')}
            </a>
          </Button>
        </div>

        {issuedUrl === null ? null : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="calendar-subscription-url">{t('urlLabel')}</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="calendar-subscription-url"
                readOnly
                value={issuedUrl}
                className="min-w-0 flex-1 font-mono text-xs"
                onFocus={event => {
                  event.currentTarget.select();
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void copy(issuedUrl)}
              >
                <Copy aria-hidden />
                {t('copy')}
              </Button>
            </div>
            <OneClickSubscribe links={subscribeLinks(issuedUrl)} />
            <Alert>
              <AlertDescription>{t('shownOnce')}</AlertDescription>
            </Alert>
          </div>
        )}

        {status.isPending ? null : active ? (
          <div className="flex flex-col gap-2">
            {issuedUrl === null && status.data?.createdAt ? (
              <p className="text-muted-foreground text-sm">
                {t('active', {
                  date: format.dateTime(new Date(status.data.createdAt), {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }),
                })}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  issue.mutate({ path });
                }}
              >
                {issue.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                {t('replace')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  revoke.mutate({ path });
                }}
              >
                {t('turnOff')}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                issue.mutate({ path });
              }}
            >
              {issue.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {t('create')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const SERVICES = ['google', 'outlook', 'office', 'apple'] as const;

function OneClickSubscribe({ links }: { links: SubscribeLinks }) {
  const t = useTranslations('calendar.subscription');

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium" id="calendar-one-click">
        {t('oneClick')}
      </p>
      <ul aria-labelledby="calendar-one-click" className="flex flex-wrap gap-2">
        {SERVICES.map(service => (
          <li key={service}>
            <Button asChild variant="outline" size="sm">
              {service === 'apple' ? (
                <a href={links.apple}>{t(`service.${service}`)}</a>
              ) : (
                <a href={links[service]} target="_blank" rel="noopener noreferrer">
                  {t(`service.${service}`)}
                </a>
              )}
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">{t('oneClickHint')}</p>
    </div>
  );
}
