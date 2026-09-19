'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  programMemberMutations,
  programMemberQueries,
  type ProgramMember,
} from '@/entities/program-member';
import { toApiError } from '@/shared/api';
import { Select, SelectItem } from '@/shared/ui';

import { MEMBERSHIP_STATUSES } from '../model/schema';

/**
 * The status is the whole verb: anything but `active` takes the student role
 * away, so it is a control rather than a badge.
 */
export function MembershipStatusSelect({
  institutionId,
  programId,
  member,
}: {
  institutionId: string;
  programId: string;
  member: ProgramMember;
}) {
  const t = useTranslations('programMembers');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...programMemberMutations.update(),
    onSuccess: async updated => {
      toast.success(
        t('statusChanged', {
          name: member.displayName,
          status: t(`status.${updated.status}`),
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: programMemberQueries.listKey({ path: { institutionId, programId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Select
      uiSize="sm"
      aria-label={t('statusFor', { name: member.displayName })}
      value={member.status}
      disabled={mutation.isPending}
      onValueChange={status => {
        mutation.mutate({
          path: { institutionId, programId, membershipId: member.id },
          body: { status: status as ProgramMember['status'] },
        });
      }}
    >
      {MEMBERSHIP_STATUSES.map(status => (
        <SelectItem key={status} value={status}>
          {t(`status.${status}`)}
        </SelectItem>
      ))}
    </Select>
  );
}
