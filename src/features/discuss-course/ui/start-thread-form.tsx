'use client';

import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { discussionMutations, type DiscussionAddress } from '@/entities/discussion';
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
  Input,
  Textarea,
} from '@/shared/ui';

import { threadFormSchema, type ThreadFormValues } from '../model/schema';
import {
  AttachmentUploadError,
  useAttachments,
  withFiles,
} from '../model/use-attachments';
import { useRefreshDiscussion } from '../model/use-refresh-discussion';
import { AttachmentPicker } from './attachment-picker';

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
  const refresh = useRefreshDiscussion();
  const form = useForm<ThreadFormValues>({
    resolver: useZodResolver(threadFormSchema),
    defaultValues: { title: '', body: '' },
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
    ...discussionMutations.start(),
    onSuccess: async thread => {
      uploads.reset();
      toast.success(t('started'));
      await refresh();
      onStarted(thread.id);
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
      path: address,
      body: {
        title: values.title.trim(),
        body: values.body.trim(),
        ...withFiles(attachments),
      },
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
        <AttachmentPicker
          files={uploads.files}
          onAdd={uploads.add}
          onRemove={uploads.remove}
          disabled={busy}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
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
