'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { learningSpaceMutations, learningSpaceQueries } from '@/entities/learning-space';
import { toApiError } from '@/shared/api';
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
  EMPTY_SPACE,
  learningSpaceFormSchema,
  toSpacePayload,
  type LearningSpaceFormValues,
} from '../model/schema';

export function LearningSpaceForm({
  institutionId,
  offeringId,
  defaultName,
}: {
  institutionId: string;
  offeringId: string;
  defaultName?: string;
}) {
  const t = useTranslations('learningSpace');
  const queryClient = useQueryClient();

  const form = useForm<LearningSpaceFormValues>({
    resolver: useZodResolver(learningSpaceFormSchema),
    defaultValues: { ...EMPTY_SPACE, name: defaultName ?? '' },
  });

  const mutation = useMutation({
    ...learningSpaceMutations.create(),
    onSuccess: async () => {
      toast.success(t('created'));
      await queryClient.invalidateQueries({
        queryKey: learningSpaceQueries.listKey({
          path: { institutionId },
          query: { offeringId },
        }),
      });
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 409) {
        form.setError('name', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({
      path: { institutionId },
      body: { courseOfferingId: offeringId, ...toSpacePayload(values) },
    });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form} schema={learningSpaceFormSchema}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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
          name="shortName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.shortName')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder={t('placeholder.shortName')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.summary')}</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder={t('placeholder.summary')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div>
                <FormLabel>{t('field.visible')}</FormLabel>
                <FormDescription>{t('field.visibleHint')}</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" className="self-start" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('create')}
        </Button>
      </form>
    </Form>
  );
}
