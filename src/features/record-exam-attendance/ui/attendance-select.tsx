'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  ATTENDANCE_OUTCOMES,
  isAttendanceOutcome,
  offeringExamTermMutations,
  offeringExamTermQueries,
  type ExamRegistrant,
} from '@/entities/offering-exam-term';
import { offeringResultQueries } from '@/entities/offering-result';
import { toApiError } from '@/shared/api';
import { Label, Select, SelectItem } from '@/shared/ui';

const NOT_RECORDED = '';

export function AttendanceSelect({
  institutionId,
  offeringId,
  examTermId,
  registrant,
}: {
  institutionId: string;
  offeringId: string;
  examTermId: string;
  registrant: ExamRegistrant;
}) {
  const t = useTranslations('examAttendance');
  const queryClient = useQueryClient();
  const recorded = isAttendanceOutcome(registrant.status)
    ? registrant.status
    : NOT_RECORDED;
  const [value, setValue] = useState<string>(recorded);

  const record = useMutation({
    ...offeringExamTermMutations.recordAttendance(),
    onSuccess: async (_, { body }) => {
      toast.success(t(`recorded.${body.status}`, { student: registrant.displayName }));
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: offeringExamTermQueries.registrantsKey({
            path: { institutionId, offeringId, examTermId },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: offeringExamTermQueries.listKey({
            path: { institutionId, offeringId },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: offeringResultQueries.listKey({
            path: { institutionId, offeringId },
          }),
        }),
      ]);
    },
    onError: error => {
      setValue(recorded);
      toast.error(toApiError(error).message);
    },
  });

  const selectId = `attendance-${registrant.id}`;

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={selectId} className="sr-only">
        {t('attendanceOf', { student: registrant.displayName })}
      </Label>
      <Select
        id={selectId}
        uiSize="sm"
        value={value}
        disabled={record.isPending}
        onValueChange={next => {
          if (!isAttendanceOutcome(next)) return;

          setValue(next);
          record.mutate({
            path: {
              institutionId,
              offeringId,
              examTermId,
              registrationId: registrant.id,
            },
            body: { status: next },
          });
        }}
      >
        {recorded === NOT_RECORDED ? (
          <SelectItem value={NOT_RECORDED} disabled>
            {t('status.registered')}
          </SelectItem>
        ) : null}
        {ATTENDANCE_OUTCOMES.map(outcome => (
          <SelectItem key={outcome} value={outcome}>
            {t(`status.${outcome}`)}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
