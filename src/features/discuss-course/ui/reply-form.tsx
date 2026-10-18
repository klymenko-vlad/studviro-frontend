'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  discussionMutations,
  discussionQueries,
  type DiscussionAddress,
} from '@/entities/discussion';
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
  Textarea,
} from '@/shared/ui';

import { replyFormSchema, type ReplyFormValues } from '../model/schema';
import { useRefreshDiscussion } from '../model/use-refresh-discussion';

export function ReplyForm({
  address,
  threadId,
}: {
  address: DiscussionAddress;
  threadId: string;
}) {
  const t = useTranslations('discussion');
  const queryClient = useQueryClient();
  const refresh = useRefreshDiscussion(address);
  const form = useForm<ReplyFormValues>({
    resolver: useZodResolver(replyFormSchema),
    defaultValues: { body: '' },
  });

  const mutation = useMutation({
    ...discussionMutations.reply(),
    onSuccess: async thread => {
      queryClient.setQueryData(
        discussionQueries.threadKey({ path: { ...address, threadId } }),
        thread,
      );
      form.reset({ body: '' });
      toast.success(t('replied'));
      await refresh();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({
      path: { ...address, threadId },
      body: { body: values.body.trim() },
    });
  });

  return (
    <Form {...form} schema={replyFormSchema}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('replyLabel')}</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : null}
            {t('reply')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
