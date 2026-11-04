import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

import type { TeachingOffering } from '../model/teaching-offering';

const STATUS_VARIANT = {
  planned: 'outline',
  open: 'success',
  running: 'default',
  closed: 'secondary',
  cancelled: 'destructive',
} as const;

export function TeachingOfferingCard({
  offering,
  href,
}: {
  offering: TeachingOffering;
  href?: string;
}) {
  const t = useTranslations('myTeaching');

  return (
    <Card interactive={href !== undefined}>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle as="h3" className="text-base">
            {href === undefined ? (
              offering.course.title
            ) : (
              <Link href={href} className="stretched-link">
                {offering.course.title}
              </Link>
            )}
          </CardTitle>
          <Badge variant={STATUS_VARIANT[offering.offering.status]}>
            {t(`offeringStatus.${offering.offering.status}`)}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-xs">{offering.course.code}</p>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 text-sm">
        <p className="text-muted-foreground">
          {t('enrolled', { count: offering.enrolledCount })}
          {offering.offering.capacity === null
            ? null
            : ` ${t('ofCapacity', { capacity: offering.offering.capacity })}`}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t(`role.${offering.role}`)}</Badge>
          {offering.isPrimary ? <Badge variant="outline">{t('primary')}</Badge> : null}
          {offering.course.credits === null ? null : (
            <Badge variant="outline">
              {t('credits', { count: offering.course.credits })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
