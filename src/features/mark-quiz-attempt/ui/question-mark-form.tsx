'use client';

import { useId, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { MarkedQuestion } from '@/entities/quiz';
import { Button, Input, Label, Textarea } from '@/shared/ui';

export interface QuestionMark {
  mark: number | null;
  comment: string | null;
}

export function QuestionMarkForm({
  question,
  pending,
  onSave,
}: {
  question: MarkedQuestion;
  pending: boolean;
  onSave: (mark: QuestionMark) => void;
}) {
  const t = useTranslations('quiz.marking');
  const id = useId();
  const essay = question.type === 'essay';
  const [mark, setMark] = useState(
    question.manualMark === null ? '' : String(question.manualMark),
  );
  const [comment, setComment] = useState(question.comment ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const value = Number(mark.replace(',', '.'));
    if (
      mark.trim() === '' ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > question.mark
    ) {
      setError(t('range', { mark: question.mark }));
      return;
    }
    if (!essay && comment.trim() === '') {
      setError(t('reasonRequired'));
      return;
    }
    setError(null);
    onSave({ mark: value, comment: comment.trim() === '' ? null : comment.trim() });
  };

  return (
    <form
      noValidate
      aria-label={t('formLabel', { number: question.position + 1 })}
      className="flex flex-col gap-3 border-t pt-3"
      onSubmit={event => {
        event.preventDefault();
        save();
      }}
    >
      <div className="flex flex-col gap-2 sm:max-w-40">
        <Label htmlFor={`${id}-mark`}>{t(essay ? 'mark' : 'override')}</Label>
        <Input
          id={`${id}-mark`}
          inputMode="decimal"
          autoComplete="off"
          value={mark}
          aria-invalid={error !== null}
          aria-describedby={`${id}-hint ${id}-error`}
          onChange={event => {
            setMark(event.target.value);
          }}
        />
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {t('outOf', { mark: question.mark })}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-comment`}>{t(essay ? 'comment' : 'reason')}</Label>
        <Textarea
          id={`${id}-comment`}
          rows={2}
          value={comment}
          onChange={event => {
            setComment(event.target.value);
          }}
        />
      </div>
      <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
        {error ?? ''}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('save')}
        </Button>
        {question.manualMark === null ? null : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              onSave({ mark: null, comment: null });
            }}
          >
            {t(essay ? 'clearMark' : 'clearOverride')}
          </Button>
        )}
      </div>
    </form>
  );
}
