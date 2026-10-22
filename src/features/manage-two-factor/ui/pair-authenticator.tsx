'use client';

import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { apiQueries, toApiError, type TwoFactorSetupDto } from '@/shared/api';
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
} from '@/shared/ui';

import { groupSecret, twoFactorCodeSchema } from '../model/two-factor';

type Values = z.infer<typeof twoFactorCodeSchema>;

export function PairAuthenticator({
  setup,
  onEnabled,
  onCancel,
}: {
  setup: TwoFactorSetupDto;
  onEnabled: (recoveryCodes: string[]) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('accountSettings.twoFactor.pair');

  const form = useForm<Values>({
    resolver: useZodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  });

  const mutation = useMutation({
    ...apiQueries.enableTwoFactorMutation(),
    onSuccess: ({ recoveryCodes }) => {
      onEnabled(recoveryCodes);
    },
    onError: error => {
      const apiError = toApiError(error);
      form.setError('code', {
        message: apiError.status === 400 ? t('invalidCode') : apiError.message,
      });
    },
  });

  const onSubmit = form.handleSubmit(({ code }) => {
    mutation.mutate({ body: { code: code.replaceAll(/\s/g, '') } });
  });

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
        <li>{t('stepInstall')}</li>
        <li>{t('stepScan')}</li>
        <li>{t('stepConfirm')}</li>
      </ol>

      <div className="flex flex-wrap items-start gap-6">
        <svg
          role="img"
          aria-label={t('qrAlt')}
          viewBox="0 0 176 176"
          className="size-44 shrink-0 rounded-md border bg-white p-2"
        >
          <image href={setup.qrCodeDataUrl} width="176" height="176" />
        </svg>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t('manualTitle')}</span>
          <code className="bg-muted rounded px-2 py-1 font-mono text-sm break-all">
            {groupSecret(setup.secret)}
          </code>
        </div>
      </div>

      <Form {...form} schema={twoFactorCodeSchema}>
        <form onSubmit={onSubmit} noValidate className="flex max-w-sm flex-col gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('codeLabel')}</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    placeholder="123456"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : null}
              {t('submit')}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
