'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { AttendanceSelect } from '@/features/record-exam-attendance';
import {
  canRecordAttendance,
  offeringExamTermQueries,
  type OfferingExamTerm,
} from '@/entities/offering-exam-term';
import { Badge, Button, EmptyState, ListSkeleton } from '@/shared/ui';

export function OfferingExamRegistrants({
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
  const t = useTranslations('examAttendance');
  const [open, setOpen] = useState(false);
  const path = { institutionId, offeringId, examTermId: term.id };

  const registrants = useQuery({
    ...offeringExamTermQueries.registrants({ path }),
    enabled: open,
  });

  const recordable = canRecordAttendance(term, new Date());

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-label={t(open ? 'hideNamed' : 'showNamed', { label })}
          onClick={() => {
            setOpen(current => !current);
          }}
        >
          {t(open ? 'hide' : 'show')}
        </Button>
      </div>

      {!open ? null : registrants.isPending ? (
        <ListSkeleton items={2} data-testid="exam-registrants-loading" />
      ) : registrants.isError ? (
        <p className="text-muted-foreground text-sm">{t('error')}</p>
      ) : registrants.data.length === 0 ? (
        <EmptyState size="inline" title={t('empty')} />
      ) : (
        <div className="flex flex-col gap-2">
          {recordable ? null : (
            <p className="text-muted-foreground text-xs">{t('notYet')}</p>
          )}
          <ul
            className="divide-border flex flex-col divide-y rounded-md border"
            aria-label={t('listLabel', { label })}
          >
            {registrants.data.map(registrant => (
              <li
                key={registrant.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {registrant.displayName}
                  </span>
                  {registrant.email === null ? null : (
                    <span className="text-muted-foreground truncate text-xs">
                      {registrant.email}
                    </span>
                  )}
                </div>
                {recordable ? (
                  <AttendanceSelect
                    institutionId={institutionId}
                    offeringId={offeringId}
                    examTermId={term.id}
                    registrant={registrant}
                  />
                ) : (
                  <Badge variant="secondary">{t(`status.${registrant.status}`)}</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
