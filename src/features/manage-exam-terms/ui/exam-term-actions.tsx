'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  isCancelled,
  offeringExamTermMutations,
  offeringExamTermQueries,
  type OfferingExamTerm,
} from '@/entities/offering-exam-term';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

import { ExamTermForm } from './exam-term-form';

export function ExamTermActions({
  institutionId,
  offeringId,
  term,
  label,
}: {
  institutionId: string;
  offeringId: string;
  term: OfferingExamTerm;
  label: string;
}) {
  const t = useTranslations('examTermAdmin');
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const cancelled = isCancelled(term);

  const settled = (message: string) => ({
    onSuccess: async () => {
      toast.success(message);
      await queryClient.invalidateQueries({
        queryKey: offeringExamTermQueries.listKey({
          path: { institutionId, offeringId },
        }),
      });
    },
    onError: (error: unknown) => {
      toast.error(toApiError(error).message);
    },
  });

  const cancel = useMutation({
    ...offeringExamTermMutations.cancel(),
    ...settled(t('cancelled', { label })),
  });
  const remove = useMutation({
    ...offeringExamTermMutations.remove(),
    ...settled(t('removed', { label })),
  });

  const pending = cancel.isPending || remove.isPending;
  const path = { institutionId, offeringId, examTermId: term.id };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1">
        {cancelled ? null : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t('editNamed', { label })}
            aria-expanded={editing}
            onClick={() => {
              setEditing(open => !open);
            }}
          >
            {t('edit')}
          </Button>
        )}

        {cancelled ? null : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            aria-label={t('cancelNamed', { label })}
            onClick={() => {
              cancel.mutate({ path });
            }}
          >
            {cancel.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t('cancel')}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={t('removeNamed', { label })}
          onClick={() => {
            remove.mutate({ path });
          }}
        >
          {remove.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('remove')}
        </Button>
      </div>

      {editing ? (
        <ExamTermForm
          institutionId={institutionId}
          offeringId={offeringId}
          term={term}
          onDone={() => {
            setEditing(false);
          }}
        />
      ) : null}
    </div>
  );
}
