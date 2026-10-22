'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTimeZone, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  assignmentMutations,
  assignmentQueries,
  type Assignment,
} from '@/entities/assignment';
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
  Switch,
  Textarea,
} from '@/shared/ui';

import {
  assignmentFormSchema,
  EMPTY_ASSIGNMENT,
  toAssignmentPayload,
  toFormValues,
  type AssignmentFormValues,
} from '../model/schema';

export function AssignmentForm({
  institutionId,
  spaceId,
  assignment,
  onDone,
}: {
  institutionId: string;
  spaceId: string;
  assignment?: Assignment;
  onDone?: () => void;
}) {
  const t = useTranslations('assignments');
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const queryClient = useQueryClient();
  const editing = assignment !== undefined;

  const form = useForm<AssignmentFormValues>({
    resolver: useZodResolver(assignmentFormSchema),
    defaultValues: editing ? toFormValues(assignment, timeZone) : EMPTY_ASSIGNMENT,
  });

  const settle = async () => {
    await queryClient.invalidateQueries({
      queryKey: assignmentQueries.listKey({ path: { institutionId, spaceId } }),
    });
  };

  const onError = (error: unknown) => {
    const apiError = toApiError(error);

    if (apiError.status === 409) {
      form.setError('name', { message: apiError.message });
      return;
    }

    toast.error(apiError.message);
  };

  const create = useMutation({
    ...assignmentMutations.create(),
    onSuccess: async () => {
      toast.success(t('created'));
      form.reset(EMPTY_ASSIGNMENT);
      await settle();
      onDone?.();
    },
    onError,
  });

  const update = useMutation({
    ...assignmentMutations.update(),
    onSuccess: async () => {
      toast.success(t('saved'));
      await settle();
      onDone?.();
    },
    onError,
  });

  const onSubmit = form.handleSubmit(values => {
    const body = toAssignmentPayload(values, timeZone);

    if (editing) {
      update.mutate({
        path: { institutionId, spaceId, assignmentId: assignment.id },
        body,
      });
      return;
    }

    create.mutate({ path: { institutionId, spaceId }, body });
  });

  const pending = form.formState.isSubmitting || create.isPending || update.isPending;

  return (
    <Form {...form} schema={assignmentFormSchema}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={editing ? t('editLabel', { name: assignment.name }) : t('formLabel')}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.name')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder={t('placeholder.name')}
                  {...field}
                />
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
              <FormLabel>{t('field.brief')}</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder={t('placeholder.brief')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {(['opensAt', 'dueAt', 'closesAt'] as const).map(name => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(`field.${name}`)}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="maxAttempts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('field.maxAttempts')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    inputMode="numeric"
                    placeholder={t('placeholder.maxAttempts')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t('field.maxAttemptsHint')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxPoints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('field.maxPoints')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder={t('placeholder.maxPoints')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {(
          [
            ['allowsLateSubmission', 'field.allowsLate'],
            ['countsTowardFinalGrade', 'field.counts'],
            ['visible', 'field.visible'],
          ] as const
        ).map(([name, label]) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>{t(label)}</FormLabel>
              </FormItem>
            )}
          />
        ))}

        <Button type="submit" size="sm" className="self-start" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {editing ? t('save') : t('create')}
        </Button>
      </form>
    </Form>
  );
}
