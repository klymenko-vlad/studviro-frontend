'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { apiQueries, toApiError } from '@/shared/api';
import { Link, ROUTES } from '@/shared/config';
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
} from '@/shared/ui';

import {
  requestPasswordResetSchema,
  type RequestPasswordResetFormValues,
} from '../model/schema';

export function RequestPasswordResetForm() {
  const t = useTranslations('passwordReset');
  const [devToken, setDevToken] = useState<string | undefined>(undefined);

  const form = useForm<RequestPasswordResetFormValues>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    ...apiQueries.requestPasswordResetMutation(),
    onSuccess: response => {
      setDevToken(response.devToken);
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ body: values });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  if (mutation.isSuccess) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-5">
        <Alert>
          <AlertTitle>{t('requestSentTitle')}</AlertTitle>
          <AlertDescription>{t('requestSentDescription')}</AlertDescription>
        </Alert>

        {devToken ? (
          <p className="text-muted-foreground text-sm">
            {t('devTokenHint')}{' '}
            <Link
              href={`${ROUTES.resetPassword}?token=${devToken}`}
              className="text-foreground underline underline-offset-4"
            >
              {t('devTokenLink')}
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex w-full max-w-sm flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email')}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
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
