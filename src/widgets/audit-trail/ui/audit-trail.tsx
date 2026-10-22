'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import {
  AUDIT_ACTIONS,
  auditEventQueries,
  changesOf,
  labelKeyFor,
  type AuditEvent,
} from '@/entities/audit-event';
import { personQueries } from '@/entities/person';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Label,
  Select,
  SelectItem,
  Skeleton,
} from '@/shared/ui';

const ALL = 'all';

/**
 * Who changed what. The list is deliberately the change rather than the row's
 * final state: the point of an audit trail is that the previous value is
 * recoverable, and a screen that shows only what things are now answers the
 * question the database already answers.
 */
export function AuditTrail({ institutionId }: { institutionId: string }) {
  const t = useTranslations('audit');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [action, setAction] = useState<string>(ALL);

  const events = useQuery(
    auditEventQueries.list({
      path: { institutionId },
      query: action === ALL ? {} : { action: action as AuditEvent['action'] },
    }),
  );

  // Names, so a row reads "Studviro Admin" rather than a uuid. Only the actors
  // on this page are resolved: searching a downloaded directory was work
  // proportional to the institution to label a handful of rows, and missed
  // anybody past the first page of it.
  const actorIds = [
    ...new Set(
      (events.data?.items ?? [])
        .map(event => event.actorUserId)
        .filter((id): id is string => typeof id === 'string'),
    ),
  ];
  const people = useQuery({
    ...personQueries.byIds(institutionId, actorIds),
    enabled: actorIds.length > 0,
  });
  const nameOf = (userId: string | null | undefined) => {
    if (userId === null || userId === undefined) return t('systemActor');

    const named = people.data?.items.find(person => person.userId === userId);
    if (named) return named.displayName;

    // The names arrive a round-trip after the rows, so "unknown actor" would be
    // a false claim for as long as that takes. Say nothing until it is true.
    return people.isPending ? '' : t('unknownActor');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Label htmlFor="audit-action">{t('filter')}</Label>
          <Select id="audit-action" value={action} onValueChange={setAction}>
            <SelectItem value={ALL}>{t('allActions')}</SelectItem>
            {AUDIT_ACTIONS.map(candidate => (
              <SelectItem key={candidate} value={candidate}>
                {t(`action.${labelKeyFor(candidate)}`)}
              </SelectItem>
            ))}
          </Select>
        </div>

        {events.isPending ? (
          <Skeleton className="h-32 w-full" data-testid="audit-loading" />
        ) : events.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : events.data.items.length === 0 ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <ul className="flex flex-col gap-4" aria-label={t('title')}>
            {events.data.items.map(event => (
              <li
                key={event.id}
                className="flex flex-col gap-1.5 border-b pb-4 last:border-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Badge variant="secondary">
                    {t(`action.${labelKeyFor(event.action)}`)}
                  </Badge>
                  <span className="text-sm font-medium">{nameOf(event.actorUserId)}</span>
                  <span className="text-muted-foreground text-xs">
                    {format.dateTime(new Date(event.occurredAt), {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone,
                    })}
                  </span>
                </div>

                {event.summary === null || event.summary === undefined ? null : (
                  <p className="text-sm">{event.summary}</p>
                )}

                <AuditChanges event={event} />
              </li>
            ))}
          </ul>
        )}

        {events.data?.meta.hasNextPage === true ? (
          <p className="text-muted-foreground text-sm">{t('moreExist')}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AuditChanges({ event }: { event: AuditEvent }) {
  const t = useTranslations('audit');
  const changes = changesOf(event);

  if (changes.length === 0) return null;

  return (
    <ul className="flex flex-col gap-0.5">
      {changes.map(change => (
        <li key={change.field} className="text-muted-foreground text-xs">
          <span className="font-mono">{change.field}</span>{' '}
          {t('changed', {
            before: change.before ?? t('nothing'),
            after: change.after ?? t('nothing'),
          })}
        </li>
      ))}
    </ul>
  );
}
