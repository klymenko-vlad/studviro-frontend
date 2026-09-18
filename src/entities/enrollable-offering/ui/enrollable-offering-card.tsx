import type { ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

import { Badge, Card, CardContent } from '@/shared/ui';

import {
  enrollmentBlockedNote,
  seatsLabelKey,
  type EnrollableOffering,
} from '../model/enrollable-offering';

export function EnrollableOfferingCard({
  offering,
  action,
}: {
  offering: EnrollableOffering;
  action?: ReactNode;
}) {
  const t = useTranslations('enrollment');
  const format = useFormatter();
  const blocked = enrollmentBlockedNote(offering);
  const status = offering.myEnrollment?.status;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <h3 className="text-base leading-tight font-semibold">{offering.course.title}</h3>
        <p className="text-muted-foreground font-mono text-xs">{offering.course.code}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{offering.term.name}</Badge>
          {offering.course.credits === null ? null : (
            <Badge variant="outline">
              {t('credits', { credits: offering.course.credits })}
            </Badge>
          )}
          {status === undefined ? null : (
            <Badge variant={status === 'requested' ? 'secondary' : 'default'}>
              {t(`status.${status}`)}
            </Badge>
          )}
        </div>

        <p className="text-muted-foreground text-sm">
          {t(seatsLabelKey(offering), {
            seats: offering.seatsRemaining ?? 0,
            capacity: offering.capacity ?? 0,
          })}
        </p>

        <p className="text-muted-foreground text-sm">
          {offering.windowState === 'not_open' && offering.enrollmentOpensAt !== null
            ? t('window.opensOn', {
                date: format.dateTime(new Date(offering.enrollmentOpensAt), {
                  day: 'numeric',
                  month: 'short',
                }),
              })
            : offering.windowState === 'open'
              ? offering.enrollmentClosesAt === null
                ? t('window.openUntilFurtherNotice')
                : t('window.closesOn', {
                    date: format.dateTime(new Date(offering.enrollmentClosesAt), {
                      day: 'numeric',
                      month: 'short',
                    }),
                  })
              : t('window.closedNow')}
        </p>

        {blocked === null ? null : (
          <p
            className="text-muted-foreground text-sm"
            data-testid="enrollment-blocked-note"
          >
            {t(`blocked.${blocked}`)}
          </p>
        )}

        {action === undefined ? null : <div className="flex justify-end">{action}</div>}
      </CardContent>
    </Card>
  );
}
