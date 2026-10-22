'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

import { sessionApi } from '@/entities/session';
import { toApiError } from '@/shared/api';
import { useZodResolver } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
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

import { TWO_FACTOR_CHALLENGE_EXPIRED, twoFactorCodeSchema } from '../model/two-factor';

type TwoFactorValues = z.infer<typeof twoFactorCodeSchema>;

export function TwoFactorStep({
  onSignedIn,
  onRestart,
}: {
  onSignedIn: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations('auth.twoFactor');
  const [recovery, setRecovery] = useState(false);
  const [expired, setExpired] = useState(false);

  const form = useForm<TwoFactorValues>({
    resolver: useZodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  });

  const mutation = useMutation({
    mutationFn: sessionApi.completeTwoFactor,
    onSuccess: onSignedIn,
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.code === TWO_FACTOR_CHALLENGE_EXPIRED) {
        setExpired(true);
        return;
      }
      if (apiError.status === 401) {
        form.setError('code', { message: t('invalidCode') });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ code: values.code.trim() });
  });

  if (expired) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-5">
        <Alert variant="destructive">
          <AlertTitle>{t('expiredTitle')}</AlertTitle>
          <AlertDescription>{t('expiredDescription')}</AlertDescription>
        </Alert>
        <Button type="button" onClick={onRestart}>
          {t('startAgain')}
        </Button>
      </div>
    );
  }

  return (
    <Form {...form} schema={twoFactorCodeSchema}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex w-full max-w-sm flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">
            {recovery ? t('recoveryDescription') : t('description')}
          </p>
        </div>

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{recovery ? t('recoveryLabel') : t('codeLabel')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="one-time-code"
                  inputMode={recovery ? 'text' : 'numeric'}
                  placeholder={recovery ? 'xxxxx-xxxxx' : '123456'}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setRecovery(!recovery);
                    form.reset({ code: '' });
                  }}
                >
                  {recovery ? t('useAuthenticator') : t('useRecoveryCode')}
                </button>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : null}
          {mutation.isPending ? t('verifying') : t('verify')}
        </Button>

        <Button type="button" variant="ghost" onClick={onRestart}>
          {t('back')}
        </Button>
      </form>
    </Form>
  );
}
