'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { CaptchaNotice, useCaptcha } from '@/entities/captcha';
import { sessionApi } from '@/entities/session';
import { toApiError } from '@/shared/api';
import { LANDING_ROUTE, useRouter } from '@/shared/config';
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
  PasswordInput,
} from '@/shared/ui';

import { signInSchema, type SignInFormValues } from '../model/sign-in';

interface SignInProps {
  /** Where to land after signing in. Defaults to the account page. */
  next?: string | undefined;
  /** Read on the server, because it is fixed at deploy. */
  captchaEnabled?: boolean;
}

export function SignIn({ next, captchaEnabled = false }: SignInProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const queryClient = useQueryClient();
  const captcha = useCaptcha(captchaEnabled);

  const form = useForm<SignInFormValues>({
    resolver: useZodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: sessionApi.signIn,
    onSuccess: () => {
      /**
       * `push` before `refresh`, and both are needed. The session cookies were
       * set by the response we just received, so every cached RSC payload —
       * including the root layout that renders the header — was produced while
       * signed out. Refreshing first only invalidates the route being left;
       * the destination still renders from the stale cache and shows a
       * signed-out header to someone who has just signed in.
       */
      // Anything cached so far was fetched as somebody else, or as nobody.
      void queryClient.resetQueries();
      router.push(next ?? LANDING_ROUTE);
      router.refresh();
    },
    onError: error => {
      const apiError = toApiError(error);

      // The backend answers 401 for both a wrong password and an unknown email,
      // on purpose. Echoing that one message keeps the frontend from leaking
      // the distinction the API went to the trouble of hiding.
      if (apiError.status === 401) {
        form.setError('password', { message: t('invalidCredentials') });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(async values => {
    try {
      mutation.mutate({ ...values, captcha: await captcha.solve() });
    } catch {
      toast.error(t('captchaFailed'));
    }
  });

  const pending =
    form.formState.isSubmitting || mutation.isPending || captcha.status === 'solving';

  return (
    <Form {...form} schema={signInSchema}>
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
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t('placeholder.email')}
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
                  autoComplete="current-password"
                  placeholder={t('placeholder.currentPassword')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <CaptchaNotice enabled={captcha.enabled} status={captcha.status} />

        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden />
              {t('signingIn')}
            </>
          ) : (
            t('signIn')
          )}
        </Button>
      </form>
    </Form>
  );
}
