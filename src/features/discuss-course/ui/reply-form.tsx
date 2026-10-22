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
    onSuccess: async thread => {
      queryClient.setQueryData(
        discussionQueries.threadKey({ path: { ...address, threadId } }),
        thread,
      );
      form.reset({ body: '' });
      uploads.reset();
      toast.success(t('replied'));
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
      body: { body: values.body.trim(), ...withFiles(attachments) },
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
