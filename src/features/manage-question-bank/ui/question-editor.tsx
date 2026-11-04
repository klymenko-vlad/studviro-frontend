'use client';

import { useId, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  CategoryPicker,
  QUESTION_TYPES,
  questionBankMutations,
  questionBankQueries,
  type Question,
  type QuestionType,
} from '@/entities/question-bank';
import { toApiError } from '@/shared/api';
import { Button, Input, Label, Select, SelectItem, Textarea } from '@/shared/ui';

import {
  blankDraft,
  draftIssues,
  draftOf,
  toQuestionPayload,
  type QuestionDraft,
} from '../model/question-draft';
import { AnswerFields } from './answer-fields';

export function QuestionEditor({
  institutionId,
  spaceId,
  question,
  categoryId = '',
  onDone,
}: {
  institutionId: string;
  spaceId: string;
  question?: Question;
  categoryId?: string;
  onDone: () => void;
}) {
  const t = useTranslations('questionBank.editor');
  const tType = useTranslations('questionBank.type');
  const id = useId();
  const queryClient = useQueryClient();
  const editing = question !== undefined;
  const [draft, setDraft] = useState<QuestionDraft>(() =>
    editing ? draftOf(question) : blankDraft('single_choice', categoryId),
  );
  const [tried, setTried] = useState(false);
  const issues = draftIssues(draft);
  const set = (changes: Partial<QuestionDraft>) => {
    setDraft(current => ({ ...current, ...changes }));
  };

  const settle = async () => {
    const path = { path: { institutionId, spaceId } };
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: questionBankQueries.questionsKey(path) }),
      queryClient.invalidateQueries({
        queryKey: questionBankQueries.categoriesKey(path),
      }),
    ]);
  };
  const options = {
    onSuccess: async () => {
      toast.success(editing ? t('saved') : t('created'));
      await settle();
      onDone();
    },
    onError: (error: unknown) => {
      toast.error(toApiError(error).message);
    },
  };
  const create = useMutation({ ...questionBankMutations.createQuestion(), ...options });
  const revise = useMutation({ ...questionBankMutations.reviseQuestion(), ...options });
  const pending = create.isPending || revise.isPending;

  const submit = () => {
    setTried(true);
    if (issues.length > 0) return;

    const { type: _type, ...body } = toQuestionPayload(draft);
    if (editing) {
      revise.mutate({ path: { institutionId, spaceId, questionId: question.id }, body });
      return;
    }
    create.mutate({ path: { institutionId, spaceId }, body: toQuestionPayload(draft) });
  };

  return (
    <form
      noValidate
      aria-label={editing ? t('editLabel', { name: question.name }) : t('label')}
      className="border-border flex flex-col gap-4 rounded-md border p-4"
      onSubmit={event => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-type`}>{t('type')}</Label>
          <Select
            id={`${id}-type`}
            value={draft.type}
            disabled={editing}
            onValueChange={value => {
              set({ type: value as QuestionType });
            }}
          >
            {QUESTION_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {tType(type)}
              </SelectItem>
            ))}
          </Select>
          {editing ? (
            <p className="text-muted-foreground text-xs">{t('typeFixed')}</p>
          ) : null}
        </div>
        <CategoryPicker
          institutionId={institutionId}
          spaceId={spaceId}
          value={draft.categoryId}
          onChange={value => {
            set({ categoryId: value });
          }}
          label={t('category')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-name`}>{t('name')}</Label>
          <Input
            id={`${id}-name`}
            autoComplete="off"
            value={draft.name}
            onChange={event => {
              set({ name: event.target.value });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-mark`}>{t('defaultMark')}</Label>
          <Input
            id={`${id}-mark`}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={draft.defaultMark}
            onChange={event => {
              set({ defaultMark: event.target.value });
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-text`}>{t('text')}</Label>
        <Textarea
          id={`${id}-text`}
          rows={3}
          value={draft.text}
          onChange={event => {
            set({ text: event.target.value });
          }}
        />
      </div>

      <AnswerFields draft={draft} onChange={set} />

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-feedback`}>{t('generalFeedback')}</Label>
        <Textarea
          id={`${id}-feedback`}
          rows={2}
          value={draft.generalFeedback}
          onChange={event => {
            set({ generalFeedback: event.target.value });
          }}
        />
      </div>

      {tried && issues.length > 0 ? (
        <ul className="text-destructive list-disc pl-5 text-sm" role="alert">
          {issues.map(issue => (
            <li key={issue}>{t(`issue.${issue}`)}</li>
          ))}
        </ul>
      ) : null}

      {editing ? (
        <p className="text-muted-foreground text-sm">{t('versionNote')}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {editing ? t('save') : t('create')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
