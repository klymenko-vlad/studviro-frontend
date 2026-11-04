'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import type { RestrictionTarget } from '@/features/restrict-access';
import {
  RestrictionNote,
  restrictionQueries,
  type StudentSight,
} from '@/entities/restriction';
import { DEFAULT_TIME_ZONE } from '@/shared/config';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Label,
  LoadMore,
  QueryError,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@/shared/ui';

const PAGE = 25;

export function ItemSight({
  institutionId,
  spaceId,
  target,
  onDone,
}: {
  institutionId: string;
  spaceId: string;
  target: RestrictionTarget;
  onDone: () => void;
}) {
  const t = useTranslations('restriction.sight');
  const headingId = useId();
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim());

  const sight = useInfiniteQuery({
    ...restrictionQueries.sight({
      path: { institutionId, spaceId, kind: target.kind, itemId: target.id },
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });

  const first = sight.data?.pages[0];
  const students = sight.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <section
      aria-labelledby={headingId}
      className="bg-muted/40 flex flex-col gap-3 rounded-md border p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-medium">
          {t('named', { title: target.title })}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t('close')}
        </Button>
      </div>

      {sight.isPending ? (
        <TableSkeleton rows={3} />
      ) : sight.isError ? (
        <QueryError
          onRetry={() => void sight.refetch()}
          title={t('errorTitle')}
          description={t('errorDescription')}
        />
      ) : first === undefined || first.students === 0 ? (
        <EmptyState size="inline" title={t('noStudents')} />
      ) : (
        <>
          <div className="text-sm">
            <p className="font-medium">
              {t('summary', { canOpen: first.canOpen, students: first.students })}
            </p>
            <p className="text-muted-foreground">
              {t('detail', { seeTitle: first.seeTitle, seeNothing: first.seeNothing })}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor={filterId}>{t('filter')}</Label>
            <Input
              id={filterId}
              type="search"
              autoComplete="off"
              placeholder={t('filterPlaceholder')}
              value={filter}
              onChange={event => {
                setFilter(event.target.value);
              }}
            />
          </div>

          {students.length === 0 ? (
            <EmptyState size="inline" title={t('empty')} />
          ) : (
            <Table label={t('tableLabel')}>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{t('student')}</TableHead>
                  <TableHead scope="col">{t('now')}</TableHead>
                  <TableHead scope="col">{t('why')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.userId}>
                    <TableCell className="align-top">
                      <span className="font-medium">{student.displayName}</span>
                      <span className="text-muted-foreground block text-xs">
                        {student.email}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={student.sight === 'full' ? 'secondary' : 'outline'}>
                        {t(student.sight)}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <Reason student={student} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <LoadMore
            shown={students.length}
            hasMore={sight.hasNextPage}
            pending={sight.isFetchingNextPage}
            onLoadMore={() => void sight.fetchNextPage()}
          />
        </>
      )}
    </section>
  );
}

function Reason({ student }: { student: StudentSight }) {
  const t = useTranslations('restriction.sight');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;

  return (
    <div className="flex flex-col gap-1 text-sm">
      {student.source === 'section' ? (
        <p className="text-muted-foreground">{t('viaSection')}</p>
      ) : null}
      {student.reason === 'hidden' ? <p>{t('hidden')}</p> : null}
      {student.reason === 'ended' ? <p>{t('ended')}</p> : null}
      {student.reason === 'scheduled' && student.availableFrom !== null ? (
        <p>
          {t('scheduled', {
            when: format.dateTime(new Date(student.availableFrom), {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone,
            }),
          })}
        </p>
      ) : null}
      {student.reason === 'locked' ? (
        <RestrictionNote restriction={student.restriction} audience="student" />
      ) : null}
    </div>
  );
}
