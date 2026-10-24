'use client';

import { useFormatter, useTranslations } from 'next-intl';

import type { CourseImportReportDto } from '@/shared/api';

const COUNTS = [
  'sections',
  'materials',
  'files',
  'assignments',
  'quizzes',
  'questionCategories',
  'questions',
] as const;

export function ImportReport({ report }: { report: CourseImportReportDto }) {
  const t = useTranslations('courseImport');
  const format = useFormatter();
  const counted = COUNTS.filter(name => report.counts[name] > 0);
  const { dateShift } = report;
  const days = format.number(Math.abs(dateShift.days));

  return (
    <div className="flex flex-col gap-3 text-sm">
      {counted.length === 0 ? (
        <p>{t('nothing')}</p>
      ) : (
        <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label={t('countsLabel')}>
          {counted.map(name => (
            <li key={name}>{t(`counts.${name}`, { count: report.counts[name] })}</li>
          ))}
        </ul>
      )}

      <p>
        {!dateShift.applied
          ? t('noShift')
          : dateShift.days === 0
            ? t('sameStart')
            : t(dateShift.days > 0 ? 'shiftLater' : 'shiftEarlier', {
                days,
                count: Math.abs(dateShift.days),
              })}
        {report.shiftedDates > 0
          ? ` ${t('shiftedDates', { count: report.shiftedDates })}`
          : null}
      </p>
      {report.remappedReferences > 0 ? (
        <p>{t('remapped', { count: report.remappedReferences })}</p>
      ) : null}
      <p className="text-muted-foreground">
        {report.visibility === 'hidden' ? t('hiddenNote') : t('visibleNote')}
      </p>

      {report.flags.length === 0 ? null : (
        <ul className="flex flex-col gap-2" aria-label={t('flagsLabel')}>
          {report.flags.map(flag => (
            <li key={flag.code} className="border-l-2 border-amber-500 pl-3">
              <p className="font-medium">
                {t(`flags.${flag.code}`, { count: flag.count })}
              </p>
              <p className="text-muted-foreground break-words">
                {flag.titles.join(', ')}
                {flag.count > flag.titles.length
                  ? ` ${t('more', { count: flag.count - flag.titles.length })}`
                  : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
