'use client';

import { useTranslations } from 'next-intl';

import { barPercent, hasTarget, type ProgrammeStanding } from '@/entities/study-progress';
import { Badge, Card, CardContent } from '@/shared/ui';

/**
 * U2: a grade list answers "what did I get". This answers "how much is left",
 * which is the question a student actually has.
 */
export function ProgrammeStandingCard({ standing }: { standing: ProgrammeStanding }) {
  const t = useTranslations('grades.standing');
  const measurable = hasTarget(standing);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{standing.programName}</span>
            <span className="text-muted-foreground font-mono text-xs">
              {standing.programCode}
            </span>
            {standing.studyYear === null ? null : (
              <Badge variant="secondary">{t('year', { year: standing.studyYear })}</Badge>
            )}
          </div>

          {standing.creditsComplete ? <Badge>{t('creditsComplete')}</Badge> : null}
        </div>

        {measurable ? (
          <>
            <div
              className="bg-muted h-2 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={standing.percentComplete ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('barLabel', { name: standing.programName })}
            >
              <div
                className="bg-primary h-full rounded-full transition-[width]"
                style={{ width: `${barPercent(standing)}%` }}
              />
            </div>

            <p className="text-muted-foreground text-sm">
              {t('measured', {
                earned: standing.creditsEarned,
                required: standing.creditsRequired ?? 0,
                percent: standing.percentComplete ?? 0,
                remaining: standing.creditsRemaining ?? 0,
              })}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            {t('noTarget', { earned: standing.creditsEarned })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
