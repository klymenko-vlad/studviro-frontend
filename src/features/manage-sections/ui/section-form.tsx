'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  learningSectionMutations,
  learningSectionQueries,
  type LearningSection,
} from '@/entities/learning-section';
import { toApiError } from '@/shared/api';
import { useZodResolver } from '@/shared/lib';
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

import {
  EMPTY_SECTION,
  sectionFormSchema,
  toSectionFormValues,
  toSectionPayload,
  type SectionFormValues,
} from '../model/schema';

export function SectionForm({
  institutionId,
  spaceId,
  section,
  onDone,
}: {
  institutionId: string;
  spaceId: string;
  section?: LearningSection;
  onDone?: () => void;
}) {
  const t = useTranslations('outline');
  const queryClient = useQueryClient();
  const editing = section !== undefined;

  const form = useForm<SectionFormValues>({
    resolver: useZodResolver(sectionFormSchema),
    defaultValues: editing ? toSectionFormValues(section) : EMPTY_SECTION,
  });

  const settle = async (message: string) => {
    toast.success(message);
    await queryClient.invalidateQueries({
      queryKey: learningSectionQueries.listKey({ path: { institutionId, spaceId } }),
    });
    onDone?.();
  };
  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };

  const create = useMutation({
    ...learningSectionMutations.create(),
    onSuccess: async () => {
      form.reset(EMPTY_SECTION);
      await settle(t('sectionAdded'));
    },
    onError,
  });
  const update = useMutation({
    ...learningSectionMutations.update(),
    onSuccess: () => settle(t('sectionSaved')),
    onError,
  });

  const onSubmit = form.handleSubmit(values => {
    const body = toSectionPayload(values);

    if (editing) {
      update.mutate({ path: { institutionId, spaceId, sectionId: section.id }, body });
      return;
    }

    create.mutate({ path: { institutionId, spaceId }, body });
  });

  const pending = create.isPending || update.isPending;

  return (
    <Form {...form} schema={sectionFormSchema}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={
          editing ? t('editSectionLabel', { title: section.title }) : t('addSectionLabel')
        }
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.title')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder={t('placeholder.title')}
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
                <Textarea rows={2} placeholder={t('placeholder.summary')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {editing ? t('saveSection') : t('addSection')}
          </Button>
          {onDone === undefined ? null : (
            <Button type="button" variant="ghost" size="sm" onClick={onDone}>
              {t('cancel')}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
