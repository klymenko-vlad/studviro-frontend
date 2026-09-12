'use client';

import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { userMutations, userQueries } from '@/entities/user';
import { toApiError } from '@/shared/api';
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

import { buildCreateUserFormSchema, type CreateUserFormValues } from '../model/schema';

/**
 * Reference implementation of the form stack: react-hook-form for state,
 * a Zod resolver over the *generated* API schema for validation, the generated
 * TanStack mutation for submission, and shadcn's `Form` primitives for markup.
 *
 * Never hand-wire a `<label htmlFor>`/`aria-describedby` pair — `FormItem`
 * derives the ids and `FormMessage` announces the error. That association is the
 * whole reason these primitives exist.
 */
export function CreateUserForm({ onCreated }: { onCreated?: () => void }) {
  const t = useTranslations('createUser');
  const queryClient = useQueryClient();

  const schema = useMemo(
    () => buildCreateUserFormSchema({ passwordMismatch: t('passwordMismatch') }),
    [t],
  );

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', displayName: '', password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    ...userMutations.create(),
    onSuccess: async () => {
      toast.success(t('created'));
      form.reset();
      // Invalidate by the generated key so the list refetches with the same
      // key shape the query actually used.
      await queryClient.invalidateQueries({ queryKey: userQueries.listKey() });
      onCreated?.();
    },
    // Left uninferred on purpose: annotating this widens the mutation's error
    // type and discards the generated `ErrorResponseDto`.
    onError: error => {
      const apiError = toApiError(error);

      // A duplicate email is a field-level problem, not a page-level one — put
      // it where the user is looking instead of in a toast they must remember.
      if (apiError.status === 409) {
        form.setError('email', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    // `confirmPassword` exists only in the form; the API never sees it.
    const { confirmPassword: _confirmPassword, ...body } = values;
    // `mutate`, not `mutateAsync`: failures are already handled in `onError`, and
    // awaiting the async variant leaves an unhandled rejection behind.
    mutation.mutate({ body });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

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

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('displayName')}</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
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
                <PasswordInput autoComplete="new-password" {...field} />
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
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </form>
    </Form>
  );
}
