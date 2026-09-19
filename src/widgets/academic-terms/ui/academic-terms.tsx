'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import {
  AcademicTermForm,
  RetireAcademicTermButton,
} from '@/features/manage-academic-terms';
import { academicTermQueries, enrollmentWindowState } from '@/entities/academic-term';
import { usePermissions } from '@/entities/permission';
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

export function AcademicTerms({ institutionId }: { institutionId: string }) {
  const t = useTranslations('academicTerms');
  const format = useFormatter();
  const { can } = usePermissions(institutionId);
  const manageable = can('institution:manage');

  const terms = useQuery(academicTermQueries.list({ path: { institutionId } }));

  const day = (value: string | null) =>
    value === null ? '—' : format.dateTime(new Date(value), { dateStyle: 'medium' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {manageable ? <AcademicTermForm institutionId={institutionId} /> : null}

        {terms.isPending ? (
          <Skeleton className="h-24 w-full" data-testid="academic-terms-loading" />
        ) : terms.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : terms.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <Table label={t('title')} data-testid="academic-terms-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t('column.code')}</TableHead>
                <TableHead>{t('column.name')}</TableHead>
                <TableHead>{t('column.runs')}</TableHead>
                <TableHead>{t('column.enrollment')}</TableHead>
                {manageable ? (
                  <TableHead>
                    <span className="sr-only">{t('column.actions')}</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.data.map(term => {
                const window = enrollmentWindowState(term);

                return (
                  <TableRow key={term.id}>
                    <TableCell className="font-mono text-xs">{term.code}</TableCell>
                    <TableCell className="font-medium">
                      {term.name}
                      <span className="text-muted-foreground ml-2 text-xs">
                        {t(`kind.${term.kind}`)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {t('range', { from: day(term.startsAt), to: day(term.endsAt) })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant={window === 'open' ? 'default' : 'secondary'}>
                        {t(`window.${window}`)}
                      </Badge>
                      {window === 'none' ? null : (
                        <span className="text-muted-foreground ml-2 text-xs">
                          {t('range', {
                            from: day(term.enrollmentOpensAt),
                            to: day(term.enrollmentClosesAt),
                          })}
                        </span>
                      )}
                    </TableCell>
                    {manageable ? (
                      <TableCell className="text-right">
                        <RetireAcademicTermButton
                          institutionId={institutionId}
                          termId={term.id}
                          termName={term.name}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
