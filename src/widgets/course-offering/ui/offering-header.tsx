import { useFormatter, useLocale, useTranslations } from 'next-intl';

import type { CourseOffering } from '@/entities/course-offering';
import { toneStyle } from '@/shared/lib';
import { Badge } from '@/shared/ui';

export function OfferingHeader({ offering }: { offering: CourseOffering }) {
  const t = useTranslations('courseOffering');
  const format = useFormatter();
  const locale = useLocale();

  return (
    <header style={toneStyle(offering.course.code)} className="tone flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div
            aria-hidden
            className="bg-tone-soft text-tone grid size-12 shrink-0 place-items-center rounded-xl border text-lg font-semibold"
          >
            {offering.course.title.charAt(0)}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="type-title">{offering.course.title}</h1>
            <p className="text-muted-foreground font-mono text-sm">
              {offering.course.code}
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {offering.enrollment?.status === 'withdrawn'
            ? t('withdrawnStudent')
            : t(`viewerRole.${offering.viewerRole}`)}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge>{offering.term.name}</Badge>
        <Badge variant="secondary">
          {t(`offeringStatus.${offering.offering.status}`)}
        </Badge>
        {offering.course.credits === null ? null : (
          <Badge variant="outline">
            {t('credits', { count: offering.course.credits })}
          </Badge>
        )}
        {offering.offering.language === null ? null : (
          <Badge variant="outline">
            {t('language', {
              language: languageName(offering.offering.language, locale),
            })}
          </Badge>
        )}
        {offering.offering.capacity === null ? null : (
          <Badge variant="outline">
            {t('capacity', { capacity: offering.offering.capacity })}
          </Badge>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        {t('termRange', {
          starts: format.dateTime(new Date(offering.term.startsAt), {
            dateStyle: 'medium',
          }),
          ends: format.dateTime(new Date(offering.term.endsAt), { dateStyle: 'medium' }),
        })}
      </p>

      {offering.course.description === null ? null : (
        <p className="max-w-3xl text-pretty">{offering.course.description}</p>
      )}
    </header>
  );
}

function languageName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}
