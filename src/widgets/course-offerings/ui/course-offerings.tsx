'use client';

import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { OfferingForm, RetireOfferingButton } from '@/features/manage-offerings';
import {
  byTerm,
  hasNoTeacher,
  isFull,
  offeringAdminQueries,
} from '@/entities/course-offering-admin';
import { usePermissions } from '@/entities/permission';
import { institutionRoutes, Link } from '@/shared/config';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

export function CourseOfferings({ institutionId }: { institutionId: string }) {
  const t = useTranslations('offerings');
  const { can } = usePermissions(institutionId);
  const manageable = can('offering:manage');

  const offerings = useQuery(offeringAdminQueries.list({ path: { institutionId } }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {manageable ? <OfferingForm institutionId={institutionId} /> : null}

        {offerings.isPending ? (
          <Skeleton className="h-24 w-full" data-testid="offerings-loading" />
        ) : offerings.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : offerings.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <Table data-testid="offerings-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t('column.course')}</TableHead>
                <TableHead>{t('column.places')}</TableHead>
                <TableHead>{t('column.state')}</TableHead>
                {manageable ? (
                  <TableHead>
                    <span className="sr-only">{t('column.actions')}</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {byTerm(offerings.data).map(term => (
                <Fragment key={term.termId}>
                  <TableRow>
                    <TableCell
                      colSpan={manageable ? 4 : 3}
                      className="text-muted-foreground text-xs font-medium uppercase"
                    >
                      {term.termName}
                    </TableCell>
                  </TableRow>
                  {term.offerings.map(offering => (
                    <TableRow key={offering.id}>
                      <TableCell>
                        <Link
                          href={institutionRoutes(institutionId).courseOffering(
                            offering.id,
                          )}
                          className="font-medium hover:underline focus-visible:underline"
                        >
                          {offering.courseTitle}
                        </Link>
                        <span className="text-muted-foreground ml-2 font-mono text-xs">
                          {offering.courseCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {offering.capacity === null
                          ? t('places.uncapped', { enrolled: offering.enrolled })
                          : t('places.capped', {
                              enrolled: offering.enrolled,
                              capacity: offering.capacity,
                            })}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Badge variant="secondary">
                          {t(`status.${offering.status}`)}
                        </Badge>
                        {isFull(offering) ? (
                          <Badge variant="outline">{t('full')}</Badge>
                        ) : null}
                        {hasNoTeacher(offering) ? (
                          <Badge variant="destructive">{t('noTeacher')}</Badge>
                        ) : null}
                      </TableCell>
                      {manageable ? (
                        <TableCell className="text-right">
                          <RetireOfferingButton
                            institutionId={institutionId}
                            offeringId={offering.id}
                            label={`${offering.courseCode} ${offering.termCode}`}
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
