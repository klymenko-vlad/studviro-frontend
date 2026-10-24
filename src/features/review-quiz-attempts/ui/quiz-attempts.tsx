'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import {
  QUIZ_ATTEMPT_PROGRESS,
  quizQueries,
  useWhen,
  type Quiz,
  type QuizAttemptRow,
} from '@/entities/quiz';
import {
  Badge,
  Input,
  Label,
  ListSkeleton,
  LoadMore,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

const PAGE = 20;
type Progress = (typeof QUIZ_ATTEMPT_PROGRESS)[number];

export function QuizAttempts({
  institutionId,
  spaceId,
  quiz,
}: {
  institutionId: string;
  spaceId: string;
  quiz: Quiz;
}) {
  const t = useTranslations('quiz.attemptList');
  const format = useFormatter();
  const when = useWhen();
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const [state, setState] = useState<Progress | ''>('');
  const q = useDeferredValue(filter.trim());

  const attempts = useInfiniteQuery({
    ...quizQueries.attempts({
      path: { institutionId, spaceId, quizId: quiz.id },
      query: {
        limit: PAGE,
        ...(q === '' ? {} : { q }),
        ...(state === '' ? {} : { state }),
      },
    }),
    placeholderData: keepPreviousData,
  });
  const rows = attempts.data?.pages.flatMap(page => page.items) ?? [];
  const filtered = q !== '' || state !== '';
  const score = (row: QuizAttemptRow) => {
    if (row.points === null) return '—';
    const values = {
      points: format.number(row.points),
      max: format.number(quiz.maxPoints),
    };

    return row.needsMarking ? t('provisional', values) : t('points', values);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2 sm:max-w-xs sm:flex-1">
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
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${filterId}-state`}>{t('state')}</Label>
          <Select
            id={`${filterId}-state`}
            value={state}
            onValueChange={value => {
              setState(QUIZ_ATTEMPT_PROGRESS.find(option => option === value) ?? '');
            }}
          >
            <SelectItem value="">{t('any')}</SelectItem>
            {QUIZ_ATTEMPT_PROGRESS.map(option => (
              <SelectItem key={option} value={option}>
                {t(option)}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {attempts.isPending ? (
        <ListSkeleton items={3} />
      ) : attempts.isError ? (
        <p className="text-muted-foreground text-sm">{t('error')}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {filtered ? t('noMatch') : t('empty')}
        </p>
      ) : (
        <Table label={t('label', { name: quiz.name })}>
          <TableHeader>
            <TableRow>
              <TableHead>{t('student')}</TableHead>
              <TableHead>{t('attempt')}</TableHead>
              <TableHead>{t('started')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('score')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="block font-medium">{row.student.displayName}</span>
                  <span className="text-muted-foreground block text-xs">
                    {row.student.email}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{row.attempt}</TableCell>
                <TableCell>{when(row.startedAt)}</TableCell>
                <TableCell>
                  {row.closedBy === null ? (
                    <Badge variant="outline">{t('running')}</Badge>
                  ) : (
                    t(`closedBy.${row.closedBy}`)
                  )}
                </TableCell>
                <TableCell>
                  <span className="tabular-nums">{score(row)}</span>
                  {row.needsMarking ? (
                    <span className="text-muted-foreground block text-xs">
                      {t('needsMarking')}
                    </span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <LoadMore
        shown={rows.length}
        hasMore={attempts.hasNextPage}
        pending={attempts.isFetchingNextPage}
        onLoadMore={() => void attempts.fetchNextPage()}
      />
    </div>
  );
}
