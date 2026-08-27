import { useTranslations } from 'next-intl';

import type { CourseOffering } from '@/entities/course-offering';
import { Badge, Card, CardContent, CardHeader, CardTitle, Separator } from '@/shared/ui';

export function OfferingEnrollment({ offering }: { offering: CourseOffering }) {
  const t = useTranslations('courseOffering');
  const status = useTranslations('myCourses');
  const { enrollment, studyGroups } = offering;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('enrollment')}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 text-sm">
        {enrollment === null ? (
          <p className="text-muted-foreground">{t('noEnrollment')}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{status(`status.${enrollment.status}`)}</Badge>
            <Badge variant="outline">
              {status(`requirement.${enrollment.requirementType}`)}
            </Badge>
            {enrollment.attempt > 1 ? (
              <Badge variant="outline">
                {status('attempt', { attempt: enrollment.attempt })}
              </Badge>
            ) : null}
          </div>
        )}

        <Separator />

        <div className="flex flex-col gap-2">
          <h3 className="font-medium">{t('studyGroups')}</h3>
          {studyGroups.length === 0 ? (
            <p className="text-muted-foreground">{t('noStudyGroups')}</p>
          ) : (
            <ul aria-label={t('studyGroups')} className="flex flex-col gap-2">
              {studyGroups.map(group => (
                <li key={group.id} className="flex flex-wrap items-center gap-2">
                  <span>{group.name ?? group.code}</span>
                  <Badge variant="outline">{t(`studyGroupKind.${group.kind}`)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
