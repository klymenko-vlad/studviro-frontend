'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  currentAttempt,
  offeringResultMutations,
  offeringResultQueries,
  RECORDABLE_GRADES,
  standingGrade,
  type OfferingResultStudent,
  type RecordableGrade,
} from '@/entities/offering-result';
import { toApiError } from '@/shared/api';
import { Button, Label } from '@/shared/ui';

const NO_GRADE = '';

export function GradeEntryCell({
  institutionId,
  offeringId,
  student,
  canPublish,
}: {
  institutionId: string;
  offeringId: string;
  student: OfferingResultStudent;
  canPublish: boolean;
}) {
  const t = useTranslations('gradeEntry');
  const queryClient = useQueryClient();
  const attempt = currentAttempt(student);
  const [grade, setGrade] = useState<string>(standingGrade(attempt) ?? NO_GRADE);

  const record = useMutation({
    ...offeringResultMutations.record(),
    onSuccess: async () => {
      toast.success(t('saved'));
      await queryClient.invalidateQueries({
        queryKey: offeringResultQueries.listKey({
          path: { institutionId, offeringId },
        }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const submit = (stage: 'propose' | 'publish') => {
    if (grade === NO_GRADE) return;

    record.mutate({
      path: { institutionId, offeringId, enrollmentId: student.enrollmentId },
      body:
        stage === 'publish'
          ? { officialGrade: grade as RecordableGrade }
          : { proposedGrade: grade as RecordableGrade },
    });
  };

  const selectId = `grade-${student.enrollmentId}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={selectId} className="sr-only">
        {t('gradeFor', { student: student.displayName })}
      </Label>
      <select
        id={selectId}
        className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        value={grade}
        disabled={record.isPending}
        onChange={event => {
          setGrade(event.target.value);
        }}
      >
        <option value={NO_GRADE}>{t('noGrade')}</option>
        {RECORDABLE_GRADES.map(value => (
          <option key={value} value={value}>
            {t(`grade.${value}`)}
          </option>
        ))}
      </select>

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={record.isPending || grade === NO_GRADE}
        onClick={() => {
          submit('propose');
        }}
      >
        {record.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {t('propose')}
      </Button>

      {canPublish ? (
        <Button
          type="button"
          size="sm"
          disabled={record.isPending || grade === NO_GRADE}
          onClick={() => {
            submit('publish');
          }}
        >
          {t('publish')}
        </Button>
      ) : null}
    </div>
  );
}
