'use client';

import { useDeferredValue, useId, useState } from 'react';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  QUESTION_TYPES,
  questionBankMutations,
  questionBankQueries,
  type QuestionCategory,
  type QuestionSummary,
  type QuestionType,
} from '@/entities/question-bank';
import { toApiError } from '@/shared/api';
import {
  Badge,
  Button,
  Input,
  Label,
  ListSkeleton,
  LoadMore,
  Select,
  SelectItem,
} from '@/shared/ui';

import { QuestionEditor } from './question-editor';

const PAGE = 20;

export function QuestionList({
  institutionId,
  spaceId,
  category,
  onClearCategory,
}: {
  institutionId: string;
  spaceId: string;
  category: QuestionCategory | null;
  onClearCategory: () => void;
}) {
  const t = useTranslations('questionBank.questions');
  const tType = useTranslations('questionBank.type');
  const id = useId();
  const path = { institutionId, spaceId };
  const [filter, setFilter] = useState('');
  const [type, setType] = useState<QuestionType | ''>('');
  const [writing, setWriting] = useState(false);
  const q = useDeferredValue(filter.trim());

  const questions = useInfiniteQuery({
    ...questionBankQueries.questions({
      path,
      query: {
        limit: PAGE,
        ...(q === '' ? {} : { q }),
        ...(type === '' ? {} : { type }),
        ...(category === null ? {} : { categoryId: category.id }),
      },
    }),
    placeholderData: keepPreviousData,
  });
  const rows = questions.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {writing ? (
        <QuestionEditor
          institutionId={institutionId}
          spaceId={spaceId}
          categoryId={category?.id}
          onDone={() => {
            setWriting(false);
          }}
        />
      ) : (
        <Button
          type="button"
          size="sm"
          className="self-start"
          onClick={() => {
            setWriting(true);
          }}
        >
          {t('write')}
        </Button>
      )}

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
        {category === null ? null : (
          <Button type="button" variant="outline" size="sm" onClick={onClearCategory}>
            {t('inCategory', { name: category.name })}
          </Button>
        )}
      </div>

      {questions.isPending ? (
        <ListSkeleton items={3} />
      ) : questions.isError ? (
        <p className="text-muted-foreground text-sm">{t('error')}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {q === '' && type === '' && category === null ? t('empty') : t('noMatch')}
        </p>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={t('listLabel')}>
          {rows.map(question => (
            <QuestionRow key={question.id} path={path} question={question} />
          ))}
        </ul>
      )}

      <LoadMore
        shown={rows.length}
        hasMore={questions.hasNextPage}
        pending={questions.isFetchingNextPage}
        onLoadMore={() => void questions.fetchNextPage()}
      />
    </div>
  );
}

function QuestionRow({
  path,
  question,
}: {
  path: { institutionId: string; spaceId: string };
  question: QuestionSummary;
}) {
  const t = useTranslations('questionBank.questions');
  const tType = useTranslations('questionBank.type');
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const questionPath = { ...path, questionId: question.id };
  const full = useQuery({
    ...questionBankQueries.question({ path: questionPath }),
    enabled: editing,
  });
  const remove = useMutation({
    ...questionBankMutations.removeQuestion(),
    onSuccess: async () => {
      toast.success(t('removed', { name: question.name }));
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: questionBankQueries.questionsKey({ path }),
        }),
        queryClient.invalidateQueries({
          queryKey: questionBankQueries.categoriesKey({ path }),
        }),
      ]);
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <li className="border-border flex flex-col gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 font-medium break-words">{question.name}</span>
        <Badge variant="secondary">{tType(question.type)}</Badge>
        <span className="text-muted-foreground text-sm">
          {t('meta', {
            category: question.categoryName,
            mark: question.defaultMark,
            version: question.version,
          })}
        </span>
      </div>
      <p className="text-muted-foreground line-clamp-2 text-sm">{question.text}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={editing}
          aria-label={t('editNamed', { name: question.name })}
          onClick={() => {
            setEditing(current => !current);
          }}
        >
          {editing ? t('close') : t('edit')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={remove.isPending}
          aria-label={t('removeNamed', { name: question.name })}
          onClick={() => {
            remove.mutate({ path: questionPath });
          }}
        >
          {t('remove')}
        </Button>
      </div>
      {editing && full.data !== undefined ? (
        <QuestionEditor
          institutionId={path.institutionId}
          spaceId={path.spaceId}
          question={full.data}
          onDone={() => {
            setEditing(false);
          }}
        />
      ) : null}
    </li>
  );
}
