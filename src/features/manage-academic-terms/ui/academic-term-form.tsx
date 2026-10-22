'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { academicTermMutations, academicTermQueries } from '@/entities/academic-term';
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
  Select,
  SelectItem,
} from '@/shared/ui';

import {
  academicTermFormSchema,
  toCreatePayload,
  type AcademicTermFormValues,
} from '../model/schema';
import { TERM_KINDS } from '../model/term-kinds';

const EMPTY: AcademicTermFormValues = {
  code: '',
  name: '',
  kind: 'semester',
  academicYear: '',
  startsAt: '',
  endsAt: '',
  enrollmentOpensAt: '',
  enrollmentClosesAt: '',
};

export function AcademicTermForm({ institutionId }: { institutionId: string }) {
  const t = useTranslations('academicTerms');
  const queryClient = useQueryClient();

  const form = useForm<AcademicTermFormValues>({
    resolver: useZodResolver(academicTermFormSchema),
    defaultValues: EMPTY,
  });

  const mutation = useMutation({
    ...academicTermMutations.create(),
    onSuccess: async term => {
      toast.success(t('created', { name: term.name }));
      form.reset(EMPTY);
      await queryClient.invalidateQueries({
        queryKey: academicTermQueries.listKey({ path: { institutionId } }),
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
    mutation.mutate({ path: { institutionId }, body: toCreatePayload(values) });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form} schema={academicTermFormSchema}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.code')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder={t('placeholder.code')}
                  {...field}
                />
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
          name="academicYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.academicYear')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder={t('placeholder.academicYear')}
                  {...field}
                />
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
                <Select value={field.value ?? 'semester'} onValueChange={field.onChange}>
                  {TERM_KINDS.map(kind => (
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
          name="startsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.startsAt')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.endsAt')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enrollmentOpensAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.enrollmentOpensAt')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>{t('field.windowDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enrollmentClosesAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.enrollmentClosesAt')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t('add')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
