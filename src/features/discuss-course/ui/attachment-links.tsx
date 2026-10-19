'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Paperclip } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  discussionQueries,
  type DiscussionAddress,
  type DiscussionPost,
} from '@/entities/discussion';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function AttachmentLinks({
  address,
  threadId,
  post,
}: {
  address: DiscussionAddress;
  threadId: string;
  post: DiscussionPost;
}) {
  const t = useTranslations('discussion');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  if (post.attachments.length === 0) return null;

  const open = async (attachmentId: string) => {
    setPending(attachmentId);
    try {
      const { url } = await queryClient.fetchQuery(
        discussionQueries.attachmentDownloadUrl({
          path: { ...address, threadId, postId: post.id, attachmentId },
        }),
      );
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <ul
      className="flex flex-wrap gap-2"
      aria-label={t('attachmentsOf', { name: post.author.displayName })}
    >
      {post.attachments.map(attachment => (
        <li key={attachment.id}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending === attachment.id}
            aria-label={t('downloadNamed', { filename: attachment.filename })}
            onClick={() => {
              void open(attachment.id);
            }}
          >
            <Paperclip aria-hidden />
            <span className="max-w-56 truncate">{attachment.filename}</span>
            <span className="text-muted-foreground text-xs">
              {format.number(Math.max(1, Math.round(attachment.sizeBytes / 1024)))} kB
            </span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
