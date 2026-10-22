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
  Input,
  PasswordInput,
} from '@/shared/ui';

import {
  buildAcceptInvitationSchema,
  type AcceptInvitationFormValues,
} from '../model/schema';

export function AcceptInvitationForm({ token }: { token: string }) {
  const t = useTranslations('invitation');
  const router = useRouter();

  const schema = useMemo(
    () => buildAcceptInvitationSchema({ passwordMismatch: t('passwordMismatch') }),
    [t],
  );

  const form = useForm<AcceptInvitationFormValues>({
    resolver: useZodResolver(schema),
    defaultValues: { displayName: '', password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    ...apiQueries.acceptInvitationMutation(),
    onSuccess: () => {
      router.push(`${ROUTES.signIn}?accepted=1`);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    const { confirmPassword: _confirmPassword, ...body } = values;
    mutation.mutate({
      path: { token },
      body: {
        ...(body.displayName ? { displayName: body.displayName } : {}),
        ...(body.password ? { password: body.password } : {}),
      },
    });
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
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('displayName')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  placeholder={t('placeholder.displayName')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('password')}</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder={t('placeholder.password')}
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
          {pending ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
