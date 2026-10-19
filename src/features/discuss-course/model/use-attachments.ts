'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { discussionMutations, type DiscussionAddress } from '@/entities/discussion';
import { uploadViaTicket } from '@/shared/api';

export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export class AttachmentUploadError extends Error {
  constructor(
    readonly filename: string,
    readonly tooLarge: boolean,
  ) {
    super(filename);
  }
}

export function useAttachments(address: DiscussionAddress) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const ticket = useMutation(discussionMutations.attachmentTicket());

  const add = (picked: readonly File[]) => {
    setFiles(current => [...current, ...picked].slice(0, MAX_ATTACHMENTS));
  };

  const remove = (index: number) => {
    setFiles(current => current.filter((_, at) => at !== index));
  };

  const uploadAll = async () => {
    setUploading(true);
    try {
      const claims: { storageKey: string; filename: string }[] = [];
      for (const file of files) {
        try {
          claims.push(
            await uploadViaTicket(
              body => ticket.mutateAsync({ path: address, body }),
              file,
            ),
          );
        } catch {
          throw new AttachmentUploadError(file.name, file.size > MAX_ATTACHMENT_BYTES);
        }
      }

      return claims;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFiles([]);
  };

  return { files, add, remove, uploadAll, uploading, reset };
}

export function withFiles(attachments: { storageKey: string; filename: string }[]) {
  return attachments.length === 0 ? {} : { attachments };
}
