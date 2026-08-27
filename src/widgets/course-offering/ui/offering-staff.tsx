import { useTranslations } from 'next-intl';

import { teachersByPrecedence, type CourseOffering } from '@/entities/course-offering';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export function OfferingStaff({ offering }: { offering: CourseOffering }) {
  const t = useTranslations('courseOffering');
  const teachers = teachersByPrecedence(offering);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('staff')}</CardTitle>
      </CardHeader>

      <CardContent>
        {teachers.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noStaff')}</p>
        ) : (
          <ul aria-label={t('staff')} className="flex flex-col gap-3">
            {teachers.map(teacher => (
              <li
                key={`${teacher.userId}-${teacher.role}`}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="text-sm">{teacher.displayName}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t(`teachingRole.${teacher.role}`)}</Badge>
                  {teacher.isPrimary ? (
                    <Badge variant="secondary">{t('lead')}</Badge>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
