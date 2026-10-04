'use client';

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { sessionApi } from '@/entities/session';
import { toApiError } from '@/shared/api';
import { useZodResolver } from '@/shared/lib';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  PasswordInput,
} from '@/shared/ui';

import {
  buildChangePasswordSchema,
  CURRENT_PASSWORD_INCORRECT,
  PASSWORD_UNCHANGED,
  type ChangePasswordValues,
} from '../model/schema';

const EMPTY: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ChangePassword() {
  const t = useTranslations('accountSettings.password');
  const queryClient = useQueryClient();

  const schema = useMemo(
    () => buildChangePasswordSchema({ passwordMismatch: t('mismatch') }),
    [t],
  );

  const form = useForm<ChangePasswordValues>({
    resolver: useZodResolver(schema),
    defaultValues: EMPTY,
  });

  const mutation = useMutation({
    mutationFn: sessionApi.changePassword,
    onSuccess: async () => {
      form.reset(EMPTY);
      toast.success(t('changed'));
      await queryClient.invalidateQueries();
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.code === CURRENT_PASSWORD_INCORRECT) {
        form.setError('currentPassword', { message: t('incorrect') });
        return;
      }
      if (apiError.code === PASSWORD_UNCHANGED) {
        form.setError('newPassword', { message: t('unchanged') });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(({ currentPassword, newPassword }) => {
    mutation.mutate({ currentPassword, newPassword });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form} schema={schema}>
          <form onSubmit={onSubmit} noValidate className="flex max-w-sm flex-col gap-5">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('current')}</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('new')}</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription>{t('hint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('confirm')}</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <LoaderCircle className="animate-spin" aria-hidden />
                ) : null}
                {t('submit')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
