'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  enrollableOfferingQueries,
  enrollmentMutations,
  type EnrollableOffering,
} from '@/entities/enrollable-offering';
import { usePermissions } from '@/entities/permission';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function EnrollmentButton({
  institutionId,
  offering,
}: {
  institutionId: string;
  offering: EnrollableOffering;
}) {
  const t = useTranslations('enrollment');
  const queryClient = useQueryClient();
  const { can } = usePermissions(institutionId);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: enrollableOfferingQueries.listKey({ path: { institutionId } }),
    });

  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };

  const request = useMutation({
    ...enrollmentMutations.request(),
    onSuccess: async enrollment => {
      toast.success(enrollment.status === 'requested' ? t('requested') : t('enrolled'));
      await invalidate();
    },
    onError,
  });

  const withdraw = useMutation({
    ...enrollmentMutations.withdraw(),
    onSuccess: async () => {
      toast.success(t('withdrawn'));
      await invalidate();
    },
    onError,
  });

  if (!can('course:enroll')) return null;

  const pending = request.isPending || withdraw.isPending;
  const { canEnroll, canWithdraw } = offering.availability;
  const held = offering.myEnrollment;

  if (canWithdraw && held !== null)
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          withdraw.mutate({ path: { institutionId, id: held.id } });
        }}
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {t('withdraw')}
      </Button>
    );

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending || !canEnroll}
      onClick={() => {
        request.mutate({
          path: { institutionId },
          body: { courseOfferingId: offering.id },
        });
      }}
    >
      {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
      {offering.isFull ? t('full') : t('enroll')}
    </Button>
  );
}
