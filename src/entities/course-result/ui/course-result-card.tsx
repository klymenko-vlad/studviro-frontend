import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import { Badge, Card, CardContent, CardHeader, CardTitle, Separator } from '@/shared/ui';

import type { CourseResult } from '../model/course-result';

const KIND_VARIANT = {
  official: 'default',
  proposed: 'secondary',
  calculated: 'outline',
} as const;

export function CourseResultCard({
  result,
  href,
}: {
  result: CourseResult;
  href?: string;
}) {
  const t = useTranslations('grades');
  const format = useFormatter();
  const { effective, calculated, proposed, official } = result;

  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">
            {href === undefined ? (
              result.course.title
            ) : (
              <Link href={href} className="hover:underline focus-visible:underline">
                {result.course.title}
              </Link>
            )}
          </CardTitle>

          {result.isVoided ? (
            <Badge variant="destructive">{t('noStanding')}</Badge>
          ) : effective === null ? (
            <Badge variant="outline">{t('noGrade')}</Badge>
          ) : (
            <Badge
              variant={KIND_VARIANT[effective.kind]}
              aria-label={t('effectiveGrade', {
                grade: t(`grade.${effective.grade}`),
                kind: t(`kind.${effective.kind}`),
              })}
            >
              {t(`grade.${effective.grade}`)}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground font-mono text-xs">{result.course.code}</p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 text-sm">
        {result.isVoided ? (
          <p className="text-muted-foreground text-sm" data-testid="result-annulled-note">
            {t('annulledNote')}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t(`status.${result.status}`)}</Badge>
          {result.course.credits === null ? null : (
            <Badge variant="outline">
              {t('credits', { count: result.course.credits })}
            </Badge>
          )}
          {result.attempt > 1 ? (
            <Badge variant="outline">{t('attempt', { attempt: result.attempt })}</Badge>
          ) : null}
        </div>

        <Separator />

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">{t('kind.calculated')}</dt>
          <dd>
            {calculated.grade === null && calculated.points === null
              ? t('none')
              : t('calculatedValue', {
                  grade: calculated.grade === null ? '—' : t(`grade.${calculated.grade}`),
                  points: calculated.points === null ? '—' : String(calculated.points),
                })}
          </dd>

          <dt className="text-muted-foreground">{t('kind.proposed')}</dt>
          <dd>
            {proposed.grade === null
              ? t('none')
              : proposed.at === null
                ? t(`grade.${proposed.grade}`)
                : t('gradeOn', {
                    grade: t(`grade.${proposed.grade}`),
                    on: format.dateTime(new Date(proposed.at), { dateStyle: 'medium' }),
                  })}
          </dd>

          <dt className="text-muted-foreground">{t('kind.official')}</dt>
          <dd>
            {official.grade === null
              ? t('none')
              : official.recordedAt === null
                ? t(`grade.${official.grade}`)
                : t('gradeOn', {
                    grade: t(`grade.${official.grade}`),
                    on: format.dateTime(new Date(official.recordedAt), {
                      dateStyle: 'medium',
                    }),
                  })}
          </dd>
        </dl>

        {result.conflictNote === null ? null : (
          <p className="text-muted-foreground text-xs">{result.conflictNote}</p>
        )}
      </CardContent>
    </Card>
  );
}
