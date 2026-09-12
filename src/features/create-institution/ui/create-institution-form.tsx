'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { institutionMutations } from '@/entities/institution';
import { toApiError } from '@/shared/api';
import { institutionRoutes, useRouter } from '@/shared/config';
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
} from '@/shared/ui';

import {
  createInstitutionFormSchema,
  type CreateInstitutionFormValues,
} from '../model/schema';

export function CreateInstitutionForm() {
  const t = useTranslations('createInstitution');
  const router = useRouter();

  const form = useForm<CreateInstitutionFormValues>({
    resolver: zodResolver(createInstitutionFormSchema),
    defaultValues: { code: '', name: '', firstAdminUserId: '' },
  });

  const mutation = useMutation({
    ...institutionMutations.create(),
    onSuccess: institution => {
      toast.success(t('created', { name: institution.name }));
      router.push(institutionRoutes(institution.id).dashboard);
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 409) {
        form.setError('code', { message: apiError.message });
        return;
      }

      if (apiError.status === 404) {
        form.setError('firstAdminUserId', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ body: values });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex w-full max-w-sm flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('code')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormDescription>{t('codeDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="firstAdminUserId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('firstAdminUserId')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormDescription>{t('firstAdminUserIdDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('submit')}
        </Button>
      </form>
    </Form>
  );
}
