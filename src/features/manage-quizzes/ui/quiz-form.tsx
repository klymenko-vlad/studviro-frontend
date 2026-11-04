'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTimeZone, useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { AvailabilityFields } from '@/entities/availability';
import { ASSIGNMENT_COMPLETION_RULES } from '@/entities/completion';
import {
  QUIZ_GRADING_METHODS,
  QUIZ_LAYOUTS,
  QUIZ_REVIEW_OPTIONS,
  QUIZ_REVIEW_TIMINGS,
  quizMutations,
  quizQueries,
  type Quiz,
} from '@/entities/quiz';
import { toApiError } from '@/shared/api';
import { DEFAULT_TIME_ZONE } from '@/shared/config';
import { useZodResolver } from '@/shared/lib';
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from '@/shared/ui';

import {
  EMPTY_QUIZ,
  quizFormSchema,
  toFormValues,
  toQuizPayload,
  type QuizFormValues,
} from '../model/schema';

const NUMBERS = [
  ['timeLimitMinutes', 1, 1440],
  ['maxAttempts', 1, 100],
  ['maxPoints', 0, 100_000],
] as const;

export function QuizForm({
  institutionId,
  spaceId,
  quiz,
  sectionId,
  onDone,
}: {
  institutionId: string;
  spaceId: string;
  quiz?: Quiz;
  sectionId?: string | null;
  onDone?: () => void;
}) {
  const t = useTranslations('quiz.form');
  const tGrading = useTranslations('quiz.grading');
  const tCompletion = useTranslations('completion');
  const tReview = useTranslations('quiz.reviewOptions');
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const queryClient = useQueryClient();
  const editing = quiz !== undefined;

  const form = useForm<QuizFormValues>({
    resolver: useZodResolver(quizFormSchema),
    defaultValues: editing ? toFormValues(quiz, timeZone) : EMPTY_QUIZ,
  });
  const completionRule = useWatch({ control: form.control, name: 'completionRule' });

  const settle = async () => {
    const path = { path: { institutionId, spaceId } };
    await queryClient.invalidateQueries({ queryKey: quizQueries.listKey(path) });
    if (editing) {
      const quizPath = { path: { institutionId, spaceId, quizId: quiz.id } };
      await queryClient.invalidateQueries({ queryKey: quizQueries.detailKey(quizPath) });
      await queryClient.invalidateQueries({
        queryKey: quizQueries.attemptsKey(quizPath),
      });
    }
  };
  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };

  const create = useMutation({
    ...quizMutations.create(),
    onSuccess: async () => {
      toast.success(t('created'));
      form.reset(EMPTY_QUIZ);
      await settle();
      onDone?.();
    },
    onError,
  });
  const update = useMutation({
    ...quizMutations.update(),
    onSuccess: async () => {
      toast.success(t('saved'));
      await settle();
      onDone?.();
    },
    onError,
  });

  const onSubmit = form.handleSubmit(values => {
    const body = toQuizPayload(values, timeZone);

    if (editing) {
      update.mutate({ path: { institutionId, spaceId, quizId: quiz.id }, body });
      return;
    }

    create.mutate({
      path: { institutionId, spaceId },
      body: sectionId === undefined ? body : { ...body, sectionId },
    });
  });

  const pending = form.formState.isSubmitting || create.isPending || update.isPending;

  return (
    <Form {...form} schema={quizFormSchema}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={editing ? t('editLabel', { name: quiz.name }) : t('label')}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" placeholder={t('namePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brief"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('brief')}</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {(['opensAt', 'closesAt'] as const).map(name => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(name)}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <AvailabilityFields />

        <div className="grid gap-4 sm:grid-cols-3">
          {NUMBERS.map(([name, min, max]) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(name)}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={min}
                      max={max}
                      inputMode="numeric"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t(`${name}Hint`)}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="gradingMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('gradingMethod')}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    {QUIZ_GRADING_METHODS.map(method => (
                      <SelectItem key={method} value={method}>
                        {tGrading(method)}
                      </SelectItem>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="layout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('layout')}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    {QUIZ_LAYOUTS.map(layout => (
                      <SelectItem key={layout} value={layout}>
                        {t(`layouts.${layout}`)}
                      </SelectItem>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="completionRule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tCompletion('field.rule')}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    {ASSIGNMENT_COMPLETION_RULES.map(rule => (
                      <SelectItem key={rule} value={rule}>
                        {tCompletion(`rule.${rule}`)}
                      </SelectItem>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {completionRule === 'passed' ? (
            <FormField
              control={form.control}
              name="completionPassPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCompletion('field.passPoints')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        {(
          [
            'shuffleQuestions',
            'shuffleChoices',
            'countsTowardFinalGrade',
            'visible',
          ] as const
        ).map(name => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>{t(name)}</FormLabel>
              </FormItem>
            )}
          />
        ))}

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">{tReview('title')}</legend>
          <p className="text-muted-foreground text-sm">{tReview('hint')}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUIZ_REVIEW_OPTIONS.map(option => (
              <FormField
                key={option}
                control={form.control}
                name={`review.${option}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tReview(`option.${option}`)}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        {QUIZ_REVIEW_TIMINGS.map(timing => (
                          <SelectItem key={timing} value={timing}>
                            {tReview(`timing.${timing}`)}
                          </SelectItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="sm" className="self-start" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {editing ? t('save') : t('create')}
        </Button>
      </form>
    </Form>
  );
}
