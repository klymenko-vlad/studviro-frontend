import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

import { primaryTeacher, type EnrolledCourse } from '../model/enrolled-course';

const STATUS_VARIANT = {
  active: 'success',
  completed: 'secondary',
  requested: 'warning',
  provisioning: 'warning',
  withdrawn: 'secondary',
  rejected: 'destructive',
} as const;

export function EnrolledCourseCard({
  course,
  href,
}: {
  course: EnrolledCourse;
  href?: string;
}) {
  const t = useTranslations('myCourses');
  const teacher = primaryTeacher(course);

  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle as="h3" className="text-base">
            {href === undefined ? (
              course.course.title
            ) : (
              <Link href={href} className="hover:underline focus-visible:underline">
                {course.course.title}
              </Link>
            )}
          </CardTitle>
          <Badge variant={STATUS_VARIANT[course.status]}>
            {t(`status.${course.status}`)}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-xs">{course.course.code}</p>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 text-sm">
        <p className="text-muted-foreground">
          {teacher ? teacher.displayName : t('noTeacher')}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t(`requirement.${course.requirementType}`)}</Badge>
          {course.course.credits === null ? null : (
            <Badge variant="outline">
              {t('credits', { count: course.course.credits })}
            </Badge>
          )}
          {course.attempt > 1 ? (
            <Badge variant="outline">{t('attempt', { attempt: course.attempt })}</Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
