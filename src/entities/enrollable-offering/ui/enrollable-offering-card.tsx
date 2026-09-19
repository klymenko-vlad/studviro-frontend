import type { ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

import { Badge, ListingCard, ListingNote } from '@/shared/ui';

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

  const shortDate = (value: string) =>
    format.dateTime(new Date(value), { day: 'numeric', month: 'short' });

  const window =
    offering.windowState === 'not_open' && offering.enrollmentOpensAt !== null
      ? t('window.opensOn', { date: shortDate(offering.enrollmentOpensAt) })
      : offering.windowState === 'open'
        ? offering.enrollmentClosesAt === null
          ? t('window.openUntilFurtherNotice')
          : t('window.closesOn', { date: shortDate(offering.enrollmentClosesAt) })
        : t('window.closedNow');

  return (
    <ListingCard
      headingLevel="h2"
      title={offering.course.title}
      code={offering.course.code}
      action={action}
      badges={
        <>
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
        </>
      }
    >
      <ListingNote>
        {t(seatsLabelKey(offering), {
          seats: offering.seatsRemaining ?? 0,
          capacity: offering.capacity ?? 0,
        })}
      </ListingNote>

      <ListingNote>{window}</ListingNote>

      {blocked === null ? null : (
        <ListingNote data-testid="enrollment-blocked-note">
          {t(`blocked.${blocked}`)}
        </ListingNote>
      )}
    </ListingCard>
  );
}
