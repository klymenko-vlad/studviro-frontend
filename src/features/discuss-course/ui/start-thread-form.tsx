'use client';

import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { discussionMutations, type DiscussionAddress } from '@/entities/discussion';
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
  Input,
  Textarea,
} from '@/shared/ui';

import { threadFormSchema, type ThreadFormValues } from '../model/schema';
import { useRefreshDiscussion } from '../model/use-refresh-discussion';

export function StartThreadForm({
  address,
  onStarted,
  onCancel,
}: {
  address: DiscussionAddress;
  onStarted: (threadId: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('discussion');
  const refresh = useRefreshDiscussion(address);
  const form = useForm<ThreadFormValues>({
    resolver: useZodResolver(threadFormSchema),
    defaultValues: { title: '', body: '' },
  });

  const mutation = useMutation({
    ...discussionMutations.start(),
    onSuccess: async thread => {
      toast.success(t('started'));
      await refresh();
      onStarted(thread.id);
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({
      path: address,
      body: { title: values.title.trim(), body: values.body.trim() },
    });
  });

  return (
    <Form {...form} schema={threadFormSchema}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={t('newThread')}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('titleLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('bodyLabel')}</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
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
            {t('start')}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
