'use client';

import { useId, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { CategoryPicker } from '@/entities/question-bank';
import { quizMutations } from '@/entities/quiz';
import { toApiError } from '@/shared/api';
import { Button, Input, Label } from '@/shared/ui';

import { useRefreshQuiz, type QuizPath } from '../model/use-refresh-quiz';

export function AddRandomDraw({ path, onDone }: { path: QuizPath; onDone: () => void }) {
  const t = useTranslations('quiz.questions.randomDraw');
  const id = useId();
  const [categoryId, setCategoryId] = useState('');
  const [count, setCount] = useState('1');
  const [mark, setMark] = useState('1');
  const refresh = useRefreshQuiz(path);

  const add = useMutation({
    ...quizMutations.addSlots(),
    onSuccess: async () => {
      toast.success(t('added'));
      await refresh();
      onDone();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });
  const ready = categoryId !== '' && Number(count) >= 1 && Number(mark) > 0;

  return (
    <form
      aria-label={t('label')}
      className="border-border flex flex-col gap-3 rounded-md border p-3"
      onSubmit={event => {
        event.preventDefault();
        if (!ready) return;
        add.mutate({
          path,
          body: {
            kind: 'random',
            categoryId,
            pickCount: Number(count),
            mark: Number(mark),
          },
        });
      }}
    >
      <CategoryPicker
        institutionId={path.institutionId}
        spaceId={path.spaceId}
        value={categoryId}
        onChange={setCategoryId}
        label={t('category')}
      />
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-count`}>{t('count')}</Label>
          <Input
            id={`${id}-count`}
            type="number"
            min={1}
            max={50}
            inputMode="numeric"
            className="w-24"
            value={count}
            onChange={event => {
              setCount(event.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-mark`}>{t('mark')}</Label>
          <Input
            id={`${id}-mark`}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            className="w-24"
            value={mark}
            onChange={event => {
              setMark(event.target.value);
            }}
          />
        </div>
      </div>
      <Button
        type="submit"
        size="sm"
        className="self-start"
        disabled={!ready || add.isPending}
      >
        {t('add')}
      </Button>
    </form>
  );
}
