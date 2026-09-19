'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { studyGroupMutations, studyGroupQueries } from '@/entities/study-group';
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
  Select,
  SelectItem,
} from '@/shared/ui';

import {
  STUDY_GROUP_KINDS,
  studyGroupFormSchema,
  toCreatePayload,
  type StudyGroupFormValues,
} from '../model/schema';

const EMPTY: StudyGroupFormValues = { code: '', kind: 'seminar', name: '', capacity: '' };

export function StudyGroupForm({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('studyGroups');
  const queryClient = useQueryClient();

  const form = useForm<StudyGroupFormValues>({
    resolver: zodResolver(studyGroupFormSchema),
    defaultValues: EMPTY,
  });

  const mutation = useMutation({
    ...studyGroupMutations.create(),
    onSuccess: async () => {
      toast.success(t('created'));
      form.reset(EMPTY);
      await queryClient.invalidateQueries({
        queryKey: studyGroupQueries.listKey({ path: { institutionId, offeringId } }),
      });
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 409) {
        form.setError('code', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({
      path: { institutionId, offeringId },
      body: toCreatePayload(values),
    });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.code')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" placeholder="S1" className="w-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.name')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" className="w-52" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.kind')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  {STUDY_GROUP_KINDS.map(kind => (
                    <SelectItem key={kind} value={kind}>
                      {t(`kind.${kind}`)}
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
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.capacity')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="w-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" className="mt-6" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('add')}
        </Button>
      </form>
    </Form>
  );
}
