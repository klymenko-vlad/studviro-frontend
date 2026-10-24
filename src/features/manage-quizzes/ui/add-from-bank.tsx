'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  QUESTION_TYPES,
  questionBankQueries,
  type QuestionType,
} from '@/entities/question-bank';
import { quizMutations } from '@/entities/quiz';
import { toApiError } from '@/shared/api';
import {
  Button,
  Input,
  Label,
  ListSkeleton,
  LoadMore,
  Select,
  SelectItem,
} from '@/shared/ui';

import { useRefreshQuiz, type QuizPath } from '../model/use-refresh-quiz';

const PAGE = 10;

export function AddFromBank({ path }: { path: QuizPath }) {
  const t = useTranslations('quiz.questions.bank');
  const tType = useTranslations('questionBank.type');
  const id = useId();
  const [filter, setFilter] = useState('');
  const [type, setType] = useState<QuestionType | ''>('');
  const q = useDeferredValue(filter.trim());
  const refresh = useRefreshQuiz(path);

  const questions = useInfiniteQuery({
    ...questionBankQueries.questions({
      path: { institutionId: path.institutionId, spaceId: path.spaceId },
      query: {
        limit: PAGE,
        ...(q === '' ? {} : { q }),
        ...(type === '' ? {} : { type }),
      },
    }),
    placeholderData: keepPreviousData,
  });
  const rows = questions.data?.pages.flatMap(page => page.items) ?? [];

  const add = useMutation({
    ...quizMutations.addSlots(),
    onSuccess: async () => {
      toast.success(t('added'));
      await refresh();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <section
      aria-label={t('label')}
      className="border-border flex flex-col gap-3 rounded-md border p-3"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-q`}>{t('filter')}</Label>
          <Input
            id={`${id}-q`}
            type="search"
            autoComplete="off"
            placeholder={t('filterPlaceholder')}
            value={filter}
            onChange={event => {
              setFilter(event.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-type`}>{t('type')}</Label>
          <Select
            id={`${id}-type`}
            value={type}
            onValueChange={value => {
              setType(value as QuestionType | '');
            }}
          >
            <SelectItem value="">{t('anyType')}</SelectItem>
            {QUESTION_TYPES.map(option => (
              <SelectItem key={option} value={option}>
                {tType(option)}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {questions.isPending ? (
        <ListSkeleton items={2} />
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map(question => (
            <li key={question.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-0 font-medium break-words">{question.name}</span>
              <span className="text-muted-foreground">
                {t('meta', {
                  type: tType(question.type),
                  category: question.categoryName,
                  mark: question.defaultMark,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={add.isPending}
                aria-label={t('addNamed', { name: question.name })}
                onClick={() => {
                  add.mutate({
                    path,
                    body: { kind: 'question', questionIds: [question.id] },
                  });
                }}
              >
                {t('add')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <LoadMore
        shown={rows.length}
        hasMore={questions.hasNextPage}
        pending={questions.isFetchingNextPage}
        onLoadMore={() => void questions.fetchNextPage()}
      />
    </section>
  );
}
