'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  examRegistrationMutations,
  examTermQueries,
  isRegistered,
  type ExamTerm,
} from '@/entities/exam-term';
import { usePermissions } from '@/entities/permission';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function ExamRegistrationButton({
  institutionId,
  term,
}: {
  institutionId: string;
  term: ExamTerm;
}) {
  const t = useTranslations('exams');
  const queryClient = useQueryClient();
  const { can } = usePermissions(institutionId);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: examTermQueries.listKey({ path: { institutionId } }),
    });

  const register = useMutation({
    ...examRegistrationMutations.register(),
    onSuccess: async () => {
      toast.success(t('registerSucceeded'));
      await invalidate();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const cancel = useMutation({
    ...examRegistrationMutations.cancel(),
    onSuccess: async () => {
      toast.success(t('cancelSucceeded'));
      await invalidate();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  if (term.attendance === 'teaching' || !can('exam:register')) return null;

  const pending = register.isPending || cancel.isPending;
  const registration = term.myRegistration;
  const closed = term.registrationState !== 'open';

  if (isRegistered(term) && registration !== null)
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending || (closed && !term.isCancelled)}
        onClick={() => {
          cancel.mutate({ path: { institutionId, id: registration.id } });
        }}
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {t('cancelRegistration')}
      </Button>
    );

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending || closed || term.isCancelled || term.isFull}
      onClick={() => {
        register.mutate({ path: { institutionId }, body: { examTermId: term.id } });
      }}
    >
      {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
      {term.isFull ? t('full') : t('register')}
    </Button>
  );
}
