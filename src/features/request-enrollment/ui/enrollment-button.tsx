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
      toast.success(waiting ? t('leftWaitlist') : t('withdrawn'));
      await invalidate();
    },
    onError,
  });

  const queue = useMutation({
    ...enrollmentMutations.joinWaitlist(),
    onSuccess: async () => {
      toast.success(t('waitlisted'));
      await invalidate();
    },
    onError,
  });

  if (!can('course:enroll')) return null;

  const pending = request.isPending || withdraw.isPending || queue.isPending;
  const { canEnroll, canWithdraw, canJoinWaitlist } = offering.availability;
  const held = offering.myEnrollment;
  const waiting = held?.status === 'waitlisted';
  const spinner = pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null;
  const ask = () => {
    request.mutate({ path: { institutionId }, body: { courseOfferingId: offering.id } });
  };

  if (waiting)
    return (
      <div className="flex flex-wrap gap-2">
        {canEnroll ? (
          <Button type="button" size="sm" disabled={pending} onClick={ask}>
            {spinner}
            {t('takePlace')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            withdraw.mutate({ path: { institutionId, id: held.id } });
          }}
        >
          {spinner}
          {t('leaveWaitlist')}
        </Button>
      </div>
    );

  if (canJoinWaitlist)
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          queue.mutate({
            path: { institutionId },
            body: { courseOfferingId: offering.id },
          });
        }}
      >
        {spinner}
        {t('joinWaitlist')}
      </Button>
    );

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
    <Button type="button" size="sm" disabled={pending || !canEnroll} onClick={ask}>
      {spinner}
      {offering.isFull ? t('full') : t('enroll')}
    </Button>
  );
}
