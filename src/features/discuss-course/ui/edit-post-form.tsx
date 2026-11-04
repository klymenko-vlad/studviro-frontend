'use client';

import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  discussionMutations,
  type DiscussionAddress,
  type DiscussionPost,
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

export function EditPostForm({
  address,
  threadId,
  post,
  onDone,
}: {
  address: DiscussionAddress;
  threadId: string;
  post: DiscussionPost;
  onDone: () => void;
}) {
  const t = useTranslations('discussion');
  const refresh = useRefreshDiscussion();
  const form = useForm<ReplyFormValues>({
    resolver: useZodResolver(replyFormSchema),
    defaultValues: { body: post.body ?? '' },
  });

  const mutation = useMutation({
    ...discussionMutations.editPost(),
    onSuccess: async () => {
      toast.success(t('saved'));
      onDone();
      await refresh();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({
      path: { ...address, threadId, postId: post.id },
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
              <FormLabel className="sr-only">{t('editLabel')}</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : null}
            {t('save')}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
