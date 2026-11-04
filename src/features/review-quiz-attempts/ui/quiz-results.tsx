'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { quizQueries, type QuestionResult, type Quiz } from '@/entities/quiz';
import {
  Input,
  Label,
  ListSkeleton,
  LoadMore,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

const PAGE = 20;

export function QuizResults({
  institutionId,
  spaceId,
  quiz,
}: {
  institutionId: string;
  spaceId: string;
  quiz: Quiz;
}) {
  const t = useTranslations('quiz.results');
  const tQuestion = useTranslations('quiz.take.question');
  const format = useFormatter();
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim());

  const results = useInfiniteQuery({
    ...quizQueries.results({
      path: { institutionId, spaceId, quizId: quiz.id },
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });
  const rows = results.data?.pages.flatMap(page => page.items) ?? [];

  const optionLabel = (
    option: NonNullable<QuestionResult['distribution']>['options'][number],
  ) => option.text ?? tQuestion(option.value === true ? 'true' : 'false');

  return (
    <div className="flex flex-col gap-3">
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

      {results.isPending ? (
        <ListSkeleton items={3} />
      ) : results.isError ? (
        <p className="text-muted-foreground text-sm">{t('error')}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {q === '' ? t('empty') : t('noMatch')}
        </p>
      ) : (
        <Table label={t('label', { name: quiz.name })}>
          <TableHeader>
            <TableRow>
              <TableHead>{t('question')}</TableHead>
              <TableHead>{t('attempts')}</TableHead>
              <TableHead>{t('fullyRight')}</TableHead>
              <TableHead>{t('average')}</TableHead>
              <TableHead>{t('chosen')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.questionId}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="tabular-nums">{row.attempts}</TableCell>
                <TableCell className="tabular-nums">
                  {row.fullyRightPercent === null
                    ? '—'
                    : t('percent', { value: format.number(row.fullyRightPercent) })}
                  {row.awaitingMarking === 0 ? null : (
                    <span className="text-muted-foreground block text-xs">
                      {t('awaiting', { count: row.awaitingMarking })}
                    </span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {row.averageMark === null || row.averageOutOf === null
                    ? '—'
                    : t('averageOf', {
                        mark: format.number(row.averageMark),
                        outOf: format.number(row.averageOutOf),
                      })}
                </TableCell>
                <TableCell>
                  {row.distribution === null ? (
                    '—'
                  ) : (
                    <ul className="flex flex-col gap-0.5 text-sm">
                      {row.distribution.options.map(option => (
                        <li key={optionLabel(option)}>
                          {t('option', {
                            label: optionLabel(option),
                            count: option.count,
                          })}
                          {option.correct ? ` (${t('right')})` : null}
                        </li>
                      ))}
                      <li className="text-muted-foreground">
                        {t('unanswered', { count: row.distribution.unanswered })}
                      </li>
                    </ul>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <LoadMore
        shown={rows.length}
        hasMore={results.hasNextPage}
        pending={results.isFetchingNextPage}
        onLoadMore={() => void results.fetchNextPage()}
      />
    </div>
  );
}
