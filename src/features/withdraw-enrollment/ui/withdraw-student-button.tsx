'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { courseOfferingQueries } from '@/entities/course-offering';
import { courseRosterMutations, courseRosterQueries } from '@/entities/course-roster';
import { toApiError } from '@/shared/api';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';

export function WithdrawStudentButton({
  institutionId,
  offeringId,
  enrollmentId,
  studentName,
}: {
  institutionId: string;
  offeringId: string;
  enrollmentId: string;
  studentName: string;
}) {
  const t = useTranslations('withdrawEnrollment');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const path = { institutionId, offeringId };

  const withdraw = useMutation({
    ...courseRosterMutations.correct(),
    onSuccess: async () => {
      setOpen(false);
      toast.success(t('done', { student: studentName }));
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: courseRosterQueries.detailKey({ path }),
        }),
        queryClient.invalidateQueries({
          queryKey: courseOfferingQueries.detailKey({ path }),
        }),
      ]);
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t('named', { student: studentName })}
        onClick={() => {
          setOpen(true);
        }}
      >
        {t('action')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title', { student: studentName })}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={withdraw.isPending}
              onClick={() => {
                withdraw.mutate({
                  path: { ...path, enrollmentId },
                  body: { status: 'withdrawn' },
                });
              }}
            >
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
