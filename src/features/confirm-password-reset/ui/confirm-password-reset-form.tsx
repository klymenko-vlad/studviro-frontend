'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { apiQueries } from '@/shared/api';
import { ROUTES, useRouter } from '@/shared/config';
import { useZodResolver } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  PasswordInput,
} from '@/shared/ui';

import {
  buildConfirmPasswordResetSchema,
  type ConfirmPasswordResetFormValues,
} from '../model/schema';

export function ConfirmPasswordResetForm({ token }: { token: string }) {
  const t = useTranslations('passwordReset');
  const router = useRouter();

  const schema = useMemo(
    () => buildConfirmPasswordResetSchema({ passwordMismatch: t('passwordMismatch') }),
    [t],
  );

  const form = useForm<ConfirmPasswordResetFormValues>({
    resolver: useZodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    ...apiQueries.confirmPasswordResetMutation(),
    onSuccess: () => {
      router.push(`${ROUTES.signIn}?reset=1`);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ path: { token }, body: { password: values.password } });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form} schema={schema}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex w-full max-w-sm flex-col gap-5"
      >
        {mutation.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t('invalidTitle')}</AlertTitle>
            <AlertDescription>{t('invalidDescription')}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('newPassword')}</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder={t('placeholder.newPassword')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('confirmPassword')}</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder={t('placeholder.confirmPassword')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {pending ? t('confirmSubmitting') : t('confirmSubmit')}
        </Button>
      </form>
    </Form>
  );
}
