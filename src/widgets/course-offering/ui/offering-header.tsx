import { useFormatter, useTranslations } from 'next-intl';

import type { CourseOffering } from '@/entities/course-offering';
import { Badge } from '@/shared/ui';

export function OfferingHeader({ offering }: { offering: CourseOffering }) {
  const t = useTranslations('courseOffering');
  const format = useFormatter();

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="type-title">{offering.course.title}</h1>
          <p className="text-muted-foreground font-mono text-sm">
            {offering.course.code}
          </p>
        </div>
        <Badge variant="outline">{t(`viewerRole.${offering.viewerRole}`)}</Badge>
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
            {t('language', { language: offering.offering.language })}
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
