'use client';

import { useId } from 'react';
import { Paperclip, X } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button, Input, Label } from '@/shared/ui';

import { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS } from '../model/use-attachments';

const ACCEPT = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.md',
  '.csv',
  '.zip',
].join(',');

export function AttachmentPicker({
  files,
  onAdd,
  onRemove,
  disabled,
}: {
  files: readonly File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
}) {
  const t = useTranslations('discussion');
  const format = useFormatter();
  const id = useId();
  const full = files.length >= MAX_ATTACHMENTS;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{t('attachLabel')}</Label>
      <Input
        id={id}
        type="file"
        multiple
        accept={ACCEPT}
        disabled={disabled || full}
        aria-describedby={`${id}-hint`}
        onChange={event => {
          const picked = [...(event.target.files ?? [])];
          event.target.value = '';
          const tooLarge = picked.find(file => file.size > MAX_ATTACHMENT_BYTES);
          if (tooLarge !== undefined) {
            toast.error(t('uploadTooLarge', { filename: tooLarge.name }));
          }
          const fitting = picked.filter(file => file.size <= MAX_ATTACHMENT_BYTES);
          if (files.length + fitting.length > MAX_ATTACHMENTS)
            toast.error(t('tooManyFiles'));
          onAdd(fitting);
        }}
      />
      <p id={`${id}-hint`} className="text-muted-foreground text-xs">
        {t('attachHint')}
      </p>
      {files.length === 0 ? null : (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${String(index)}`}
              className="bg-muted flex items-center gap-1.5 rounded-md py-1 pr-1 pl-2 text-sm"
            >
              <Paperclip className="size-3.5" aria-hidden />
              <span className="max-w-48 truncate">{file.name}</span>
              <span className="text-muted-foreground text-xs">
                {format.number(file.size / 1024, { maximumFractionDigits: 0 })} kB
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-6"
                disabled={disabled}
                aria-label={t('removeAttachment', { filename: file.name })}
                onClick={() => {
                  onRemove(index);
                }}
              >
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
