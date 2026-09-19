'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { submissionMutations, submissionQueries } from '@/entities/submission';
import { toApiError, uploadViaTicket, type SubmitAssignmentDto } from '@/shared/api';
import { Button, Input, Label, Progress, Textarea } from '@/shared/ui';

export function SubmissionForm({
  institutionId,
  assignmentId,
  resubmit,
}: {
  institutionId: string;
  assignmentId: string;
  resubmit: boolean;
}) {
  const t = useTranslations('submissions');
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [percent, setPercent] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const ticket = useMutation(submissionMutations.uploadTicket());
  const submit = useMutation(submissionMutations.submit());

  const busy = ticket.isPending || submit.isPending || percent !== null;

  const onSubmit = async () => {
    setProblem(null);

    if (files.length === 0) {
      setProblem(t('pickFirst'));
      return;
    }

    const uploaded: SubmitAssignmentDto['files'] = [];

    setPercent(0);

    // Every file is written to the store before the API is told about any of
    // them, so a failure halfway leaves no submission at all rather than one
    // missing half its work.
    for (const [index, file] of files.entries()) {
      try {
        const result = await uploadViaTicket(
          body => ticket.mutateAsync({ path: { institutionId, assignmentId }, body }),
          file,
          filePercent => {
            setPercent(Math.round(((index + filePercent / 100) / files.length) * 100));
          },
        );

        uploaded.push(result);
      } catch (error) {
        const apiError = toApiError(error);

        setPercent(null);
        setProblem(
          apiError.code === 'UPLOAD_TOO_LARGE'
            ? t('uploadTooLarge', { filename: file.name })
            : t('uploadFailed', { filename: file.name }),
        );
        return;
      }
    }

    try {
      await submit.mutateAsync({
        path: { institutionId, assignmentId },
        body: { files: uploaded, notes: notes === '' ? null : notes },
      });
    } catch (error) {
      setPercent(null);
      setProblem(toApiError(error).message);
      return;
    }

    toast.success(t('handedIn'));
    setFiles([]);
    setNotes('');
    setPercent(null);
    await queryClient.invalidateQueries({
      queryKey: submissionQueries.mineKey({ path: { institutionId, assignmentId } }),
    });
  };

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        void onSubmit();
      }}
      noValidate
      aria-label={resubmit ? t('resubmitLabel') : t('submitLabel')}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="submission-files">{t('field.files')}</Label>
        <Input
          id="submission-files"
          type="file"
          multiple
          onChange={event => {
            setFiles([...(event.target.files ?? [])]);
            setProblem(null);
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="submission-notes">{t('field.notes')}</Label>
        <Textarea
          id="submission-notes"
          rows={3}
          value={notes}
          onChange={event => {
            setNotes(event.target.value);
          }}
        />
      </div>

      {percent === null ? null : (
        <Progress value={percent} aria-label={t('progressLabel')} />
      )}

      {problem === null ? null : (
        <p role="alert" className="text-destructive text-sm">
          {problem}
        </p>
      )}

      <Button type="submit" size="sm" className="self-start" disabled={busy}>
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {resubmit ? t('resubmit') : t('submit')}
      </Button>
    </form>
  );
}
