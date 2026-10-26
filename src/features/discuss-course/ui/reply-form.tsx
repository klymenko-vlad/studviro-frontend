'use client';

import { useMutation } from '@tanstack/react-query';
import { LoaderCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  discussionMutations,
  type DiscussionAddress,
  type DiscussionPost,
} from '@/entities/discussion';
import { useUploadErrorMessage } from '@/shared/api';
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
import {
  AttachmentUploadError,
  useAttachments,
  withFiles,
} from '../model/use-attachments';
import { useRefreshDiscussion } from '../model/use-refresh-discussion';
import { AttachmentPicker } from './attachment-picker';

/**
 * Without `replyTo` it posts at the foot of the thread. With it, the post
 * answers that one: under it if it is a top-level post, beside it and quoting
 * it if it is itself a reply.
 */
export function ReplyForm({
  address,
  threadId,
  replyTo,
  onDone,
}: {
  address: DiscussionAddress;
  threadId: string;
  replyTo?: DiscussionPost;
  onDone?: () => void;
}) {
  const t = useTranslations('discussion');
  const refresh = useRefreshDiscussion();
  const form = useForm<ReplyFormValues>({
    resolver: useZodResolver(replyFormSchema),
    defaultValues: { body: '' },
  });

  const uploads = useAttachments(address);
  const describeUploadError = useUploadErrorMessage();

  const uploadOrSay = async () => {
    try {
      return await uploads.uploadAll();
    } catch (error) {
      if (!(error instanceof AttachmentUploadError)) throw error;
      toast.error(
        t(error.tooLarge ? 'uploadTooLarge' : 'uploadFailed', {
          filename: error.filename,
        }),
      );
      return null;
    }
  };

  const mutation = useMutation({
    ...discussionMutations.reply(),
    onSuccess: async () => {
      form.reset({ body: '' });
      uploads.reset();
      toast.success(t('replied'));
      onDone?.();
      await refresh();
    },
    onError: error => {
      toast.error(describeUploadError(error));
    },
  });
  const busy = uploads.uploading || mutation.isPending;

  const onSubmit = form.handleSubmit(async values => {
    const attachments = await uploadOrSay();
    if (attachments === null) return;
    mutation.mutate({
      path: { ...address, threadId },
      body: {
        body: values.body.trim(),
        ...(replyTo === undefined ? {} : { replyToPostId: replyTo.id }),
        ...withFiles(attachments),
      },
    });
  });

  return (
    <Form {...form} schema={replyFormSchema}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-3"
        aria-label={
          replyTo === undefined
            ? undefined
            : t('replyingTo', { name: replyTo.author.displayName })
        }
      >
        {replyTo === undefined ? null : (
          <div className="border-primary/40 bg-muted/40 flex items-start gap-2 rounded-md border-l-2 px-3 py-2 text-sm">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-muted-foreground text-xs">
                {t('replyingTo', { name: replyTo.author.displayName })}
              </span>
              <span className="line-clamp-2 break-words">{replyTo.body}</span>
            </div>
            {onDone === undefined ? null : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t('cancelReply')}
                onClick={onDone}
              >
                <X aria-hidden />
              </Button>
            )}
          </div>
        )}
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
        <AttachmentPicker
          files={uploads.files}
          onAdd={uploads.add}
          onRemove={uploads.remove}
          disabled={busy}
        />
        <div>
          <Button type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {t('reply')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
