'use client';

import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

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
  PasswordInput,
} from '@/shared/ui';

import { CURRENT_PASSWORD_INCORRECT, currentPasswordSchema } from '../model/two-factor';

type Values = z.infer<typeof currentPasswordSchema>;

export function ConfirmPassword({
  prompt,
  submitLabel,
  destructive = false,
  pending,
  onConfirm,
  onCancel,
}: {
  prompt: string;
  submitLabel: string;
  destructive?: boolean;
  pending: boolean;
  onConfirm: (currentPassword: string) => Promise<unknown>;
  onCancel: () => void;
}) {
  const t = useTranslations('accountSettings.twoFactor');

  const form = useForm<Values>({
    resolver: useZodResolver(currentPasswordSchema),
    defaultValues: { currentPassword: '' },
  });

  const onSubmit = form.handleSubmit(async ({ currentPassword }) => {
    try {
      await onConfirm(currentPassword);
    } catch (error) {
      const apiError = toApiError(error);
      form.setError('currentPassword', {
        message:
          apiError.code === CURRENT_PASSWORD_INCORRECT
            ? t('incorrectPassword')
            : apiError.message,
      });
    }
  });

  return (
    <Form {...form} schema={currentPasswordSchema}>
      <form onSubmit={onSubmit} noValidate className="flex max-w-sm flex-col gap-4">
        <p className="text-sm">{prompt}</p>

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('password')}</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant={destructive ? 'destructive' : 'default'}
            disabled={pending}
          >
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
