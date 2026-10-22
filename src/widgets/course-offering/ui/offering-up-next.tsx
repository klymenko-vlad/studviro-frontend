'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, FileText, type LucideIcon } from 'lucide-react';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { assignmentQueries } from '@/entities/assignment';
import { courseOfferingHref, type OfferingTarget } from '@/entities/course-offering';
import { examTermQueries } from '@/entities/exam-term';
import { learningSpaceQueries, spaceForOffering } from '@/entities/learning-space';
import { isCancelled, offeringExamTermQueries } from '@/entities/offering-exam-term';
import { usePermissions } from '@/entities/permission';
import { Link } from '@/shared/config';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LinkRow,
  LinkRowChevron,
} from '@/shared/ui';

import { soonest } from '../model/up-next';

/**
 * What the course asks of you next, first thing on its page: the nearest
 * deadline and the nearest exam, each one tap from the tab that holds it.
 */
export function OfferingUpNext({
  institutionId,
  offeringId,
  teaching,
}: {
  institutionId: string;
  offeringId: string;
  teaching: boolean;
}) {
  const t = useTranslations('courseOffering.upNext');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { can } = usePermissions(institutionId);
  const [now] = useState(() => new Date());

  const spaces = useQuery(
    learningSpaceQueries.list({ path: { institutionId }, query: { offeringId } }),
  );
  const space =
    spaces.data === undefined ? null : spaceForOffering(spaces.data, offeringId);
  const assignments = useQuery({
    ...assignmentQueries.list({ path: { institutionId, spaceId: space?.id ?? '' } }),
    enabled: space !== null,
  });

  const readsExams = can('schedule:read');
  const myExams = useQuery({
    ...examTermQueries.list({ path: { institutionId }, query: { offeringId } }),
    enabled: readsExams && !teaching,
  });
  const offeringExams = useQuery({
    ...offeringExamTermQueries.list({ path: { institutionId, offeringId } }),
    enabled: readsExams && teaching,
  });

  const deadline = soonest(
    (assignments.data ?? []).flatMap(assignment =>
      assignment.dueAt === null
        ? []
        : [{ id: assignment.id, at: assignment.dueAt, name: assignment.name }],
    ),
    now,
  );
  const exam = soonest(
    teaching
      ? (offeringExams.data ?? [])
          .filter(term => !isCancelled(term))
          .map(term => ({ id: term.id, at: term.startsAt }))
      : (myExams.data ?? [])
          .filter(term => !term.isCancelled)
          .map(term => ({ id: term.id, at: term.startsAt })),
    now,
  );

  const when = (iso: string) =>
    format.dateTime(new Date(iso), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    });

  const href = (target: OfferingTarget) =>
    courseOfferingHref(institutionId, offeringId, target);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {deadline === null && exam === null ? (
          <p className="text-muted-foreground text-sm">{t('nothing')}</p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {deadline === null ? null : (
              <UpNextRow
                icon={FileText}
                label={t('deadline')}
                title={deadline.name}
                when={when(deadline.at)}
                href={href({
                  section: 'assignments',
                  item: { kind: 'activity', id: deadline.id },
                })}
              />
            )}
            {exam === null ? null : (
              <UpNextRow
                icon={ClipboardCheck}
                label={t('exam')}
                title={when(exam.at)}
                href={href({
                  section: 'schedule',
                  item: { kind: 'exam-term', id: exam.id },
                })}
              />
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function UpNextRow({
  icon: Icon,
  label,
  title,
  when,
  href,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  when?: string;
  href: string;
}) {
  return (
    <li>
      <LinkRow asChild>
        <Link href={href} scroll={false}>
          <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-md">
            <Icon aria-hidden className="size-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span className="truncate font-medium">{title}</span>
          </span>
          {when === undefined ? null : (
            <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
              {when}
            </span>
          )}
          <LinkRowChevron />
        </Link>
      </LinkRow>
    </li>
  );
}
