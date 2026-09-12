'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { apiQueries, toApiError } from '@/shared/api';
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
  Textarea,
} from '@/shared/ui';

import {
  REQUEST_DEMO_DEFAULTS,
  requestDemoSchema,
  type RequestDemoFormValues,
} from '../model/request-demo';

const TOO_MANY_REQUESTS = 429;

export function RequestDemo({ onSubmitted }: { onSubmitted?: () => void }) {
  const t = useTranslations('contact');

  const form = useForm<RequestDemoFormValues>({
    resolver: zodResolver(requestDemoSchema),
    defaultValues: REQUEST_DEMO_DEFAULTS,
  });

  const mutation = useMutation({
    ...apiQueries.createDemoRequestMutation(),
    onSuccess: () => {
      toast.success(t('success.title'), { description: t('success.body') });
      form.reset(REQUEST_DEMO_DEFAULTS);
      onSubmitted?.();
    },
    onError: error => {
      const apiError = toApiError(error);

      // The form's own budget is generous, but a shared address behind the
      // BFF proxy can still exhaust it. Say what to do about it rather than
      // surfacing the API's own wording.
      toast.error(
        apiError.status === TOO_MANY_REQUESTS
          ? t('errors.rateLimited')
          : t('errors.failed'),
      );
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ body: values });
  });
  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-5">
        <FormField
          control={form.control}
          name="institutionName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.institutionName')}</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
              </FormControl>
              <FormDescription>{t('form.institutionNameHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.contactName')}</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.email')}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.role')}</FormLabel>
              <FormControl>
                <Input autoComplete="organization-title" {...field} />
              </FormControl>
              <FormDescription>{t('form.roleHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.message')}</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormDescription>{t('form.messageHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/*
          The honeypot. Hidden from sight and from the accessibility tree, but
          not `type="hidden"` — a bot that fills every visible-in-the-DOM input
          is exactly what this catches.
        */}
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem className="sr-only" aria-hidden tabIndex={-1}>
              <FormLabel>{t('form.website')}</FormLabel>
              <FormControl>
                <Input tabIndex={-1} autoComplete="off" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden />
              {t('form.submitting')}
            </>
          ) : (
            t('form.submit')
          )}
        </Button>
      </form>
    </Form>
  );
}
