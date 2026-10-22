'use client';

import { useMemo } from 'react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PasswordInput,
} from '@/shared/ui';

import { buildSignUpSchema, type SignUpFormValues } from '../model/sign-up';

interface SignUpProps {
  /** Where to land once the account exists. Defaults to the account page. */
  next?: string | undefined;
  /** Read on the server, because it is fixed at deploy. */
  captchaEnabled?: boolean;
}

export function SignUp({ next, captchaEnabled = false }: SignUpProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const queryClient = useQueryClient();
  const captcha = useCaptcha(captchaEnabled);

  const schema = useMemo(
    () => buildSignUpSchema({ passwordMismatch: t('passwordMismatch') }),
    [t],
  );

  const form = useForm<SignUpFormValues>({
    resolver: useZodResolver(schema),
    defaultValues: { email: '', displayName: '', password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: sessionApi.signUp,
    onSuccess: () => {
      /**
       * Registration signs you in — the Route Handler set the session cookies
       * on the response we just received. `push` before `refresh`: refreshing
       * first only invalidates the route being left, so the destination would
       * still render the root layout cached while signed out.
       */
      // Anything cached so far was fetched as somebody else, or as nobody.
      void queryClient.resetQueries();
      router.push(next ?? LANDING_ROUTE);
      router.refresh();
    },
    onError: error => {
      const apiError = toApiError(error);

      // A taken email is a field-level problem, not a page-level one — put it
      // where the user is looking rather than in a toast they must remember.
      if (apiError.status === 409) {
        form.setError('email', { message: t('emailTaken') });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(async values => {
    // `confirmPassword` exists only in the form; the API never sees it.
    const { confirmPassword: _confirmPassword, ...body } = values;

    try {
      mutation.mutate({ ...body, captcha: await captcha.solve() });
    } catch {
      toast.error(t('captchaFailed'));
    }
  });

  const pending =
    form.formState.isSubmitting || mutation.isPending || captcha.status === 'solving';

  return (
    <Form {...form} schema={schema}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex w-full max-w-sm flex-col gap-5"
      >
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
                  autoComplete="new-password"
                  placeholder={t('placeholder.password')}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('passwordHint')}</FormDescription>
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

        <CaptchaNotice enabled={captcha.enabled} status={captcha.status} />

        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden />
              {t('signingUp')}
            </>
          ) : (
            t('signUp')
          )}
        </Button>
      </form>
    </Form>
  );
}
