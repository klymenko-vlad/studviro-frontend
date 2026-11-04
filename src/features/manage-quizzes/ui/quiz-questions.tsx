'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { quizMutations, quizQueries, type Quiz, type QuizSlot } from '@/entities/quiz';
import { toApiError } from '@/shared/api';
import { Button, Input, Label, ListSkeleton, LoadMore } from '@/shared/ui';

import { useRefreshQuiz, type QuizPath } from '../model/use-refresh-quiz';
import { AddFromBank } from './add-from-bank';
import { AddRandomDraw } from './add-random-draw';

const PAGE = 20;

export function QuizQuestions({
  institutionId,
  spaceId,
  quiz,
}: {
  institutionId: string;
  spaceId: string;
  quiz: Quiz;
}) {
  const t = useTranslations('quiz.questions');
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const [adding, setAdding] = useState<'bank' | 'random' | null>(null);
  const q = useDeferredValue(filter.trim());
  const path = { institutionId, spaceId, quizId: quiz.id };

  const slots = useInfiniteQuery({
    ...quizQueries.slots({ path, query: { limit: PAGE, ...(q === '' ? {} : { q }) } }),
    placeholderData: keepPreviousData,
  });
  const first = slots.data?.pages[0];
  const rows = slots.data?.pages.flatMap(page => page.items) ?? [];
  const lastPosition = (first?.meta.total ?? 0) - 1;

  return (
    <div className="flex flex-col gap-4">
      {first === undefined ? null : (
        <p className="text-sm" role="status">
          {t('totals', { count: first.questionCount, marks: first.totalMarks })}
        </p>
      )}

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

      {slots.isPending ? (
        <ListSkeleton items={2} />
      ) : slots.isError ? (
        <p className="text-muted-foreground text-sm">{t('error')}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {q === '' ? t('empty') : t('noMatch')}
        </p>
      ) : (
        <ol
          className="flex flex-col gap-2"
          aria-label={t('listLabel', { name: quiz.name })}
        >
          {rows.map(slot => (
            <SlotRow key={slot.id} path={path} slot={slot} last={lastPosition} />
          ))}
        </ol>
      )}

      <LoadMore
        shown={rows.length}
        hasMore={slots.hasNextPage}
        pending={slots.isFetchingNextPage}
        onLoadMore={() => void slots.fetchNextPage()}
      />

      <div className="flex flex-wrap gap-2">
        {(['bank', 'random'] as const).map(kind => (
          <Button
            key={kind}
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={adding === kind}
            onClick={() => {
              setAdding(current => (current === kind ? null : kind));
            }}
          >
            {adding === kind
              ? t('cancel')
              : t(kind === 'bank' ? 'addFromBank' : 'addRandom')}
          </Button>
        ))}
      </div>
      {adding === 'bank' ? <AddFromBank path={path} /> : null}
      {adding === 'random' ? (
        <AddRandomDraw
          path={path}
          onDone={() => {
            setAdding(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SlotRow({ path, slot, last }: { path: QuizPath; slot: QuizSlot; last: number }) {
  const t = useTranslations('quiz.questions');
  const tType = useTranslations('questionBank.type');
  const markId = useId();
  const [mark, setMark] = useState(String(slot.mark));
  const refresh = useRefreshQuiz(path);
  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };
  const update = useMutation({
    ...quizMutations.updateSlot(),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    ...quizMutations.removeSlot(),
    onSuccess: refresh,
    onError,
  });
  const slotPath = { ...path, slotId: slot.id };
  const title =
    slot.question === null
      ? t('random', { count: slot.pickCount ?? 0, category: slot.categoryName ?? '' })
      : slot.question.name;
  const busy = update.isPending || remove.isPending;

  const saveMark = () => {
    const value = Number(mark);
    if (mark === '' || !(value > 0) || value === slot.mark) {
      setMark(String(slot.mark));
      return;
    }
    update.mutate({ path: slotPath, body: { mark: value } });
  };

  return (
    <li className="border-border flex flex-col gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm tabular-nums">
          {slot.position + 1}.
        </span>
        <span className="min-w-0 font-medium break-words">{title}</span>
        {slot.question === null ? null : (
          <span className="text-muted-foreground text-sm">
            {t('typeAndVersion', {
              type: tType(slot.question.type),
              version: slot.question.version,
            })}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={markId} className="text-muted-foreground text-xs">
            {slot.kind === 'random' ? t('markEach') : t('mark')}
          </Label>
          <Input
            id={markId}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            className="w-24"
            value={mark}
            disabled={busy}
            onChange={event => {
              setMark(event.target.value);
            }}
            onBlur={saveMark}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy || slot.position === 0}
          aria-label={t('moveUpNamed', { title })}
          onClick={() => {
            update.mutate({ path: slotPath, body: { position: slot.position - 1 } });
          }}
        >
          <ArrowUp className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy || slot.position >= last}
          aria-label={t('moveDownNamed', { title })}
          onClick={() => {
            update.mutate({ path: slotPath, body: { position: slot.position + 1 } });
          }}
        >
          <ArrowDown className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          aria-label={t('removeNamed', { title })}
          onClick={() => {
            remove.mutate({ path: slotPath });
          }}
        >
          {t('remove')}
        </Button>
      </div>
    </li>
  );
}
