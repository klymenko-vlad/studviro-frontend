'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { submissionMutations, submissionQueries } from '@/entities/submission';
import { toApiError } from '@/shared/api';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@/shared/ui';

import { markFormSchema, toMarkPayload, type MarkFormValues } from '../model/schema';

export function MarkSubmissionForm({
  institutionId,
  assignmentId,
  submissionId,
  studentName,
  maxPoints,
}: {
  institutionId: string;
  assignmentId: string;
  submissionId: string;
  studentName: string;
  maxPoints: number | null;
}) {
  const t = useTranslations('marking');
  const queryClient = useQueryClient();

  const form = useForm<MarkFormValues>({
    resolver: zodResolver(markFormSchema),
    defaultValues: { points: '', feedback: '' },
  });

  const mutation = useMutation({
    ...submissionMutations.mark(),
    onSuccess: async () => {
      toast.success(t('marked', { name: studentName }));
      await queryClient.invalidateQueries({
        queryKey: submissionQueries.forAssignmentKey({
          path: { institutionId, assignmentId },
        }),
      });
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 409) {
        form.setError('points', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({
      path: { institutionId, assignmentId, submissionId },
      body: toMarkPayload(values),
    });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={t('formLabel', { name: studentName })}
        className="flex flex-wrap items-start gap-4"
      >
        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {maxPoints === null
                  ? t('field.points')
                  : t('field.pointsOf', { maxPoints })}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  className="w-28"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem className="min-w-64 flex-1">
              <FormLabel>{t('field.feedback')}</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" className="mt-6" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('save')}
        </Button>
      </form>
    </Form>
  );
}
