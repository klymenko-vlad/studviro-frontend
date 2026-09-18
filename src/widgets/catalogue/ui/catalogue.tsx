'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { CatalogueEntryForm } from '@/features/manage-catalogue';
import { catalogueQueries } from '@/entities/catalogue';
import { usePermissions } from '@/entities/permission';
import {
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

export function Catalogue({ institutionId }: { institutionId: string }) {
  const t = useTranslations('catalogue');
  const { can } = usePermissions(institutionId);

  const programs = useQuery(catalogueQueries.programs({ path: { institutionId } }));
  const courses = useQuery(catalogueQueries.courses({ path: { institutionId } }));

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('programs.title')}</CardTitle>
          <CardDescription>{t('programs.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {can('program:manage') ? (
            <CatalogueEntryForm institutionId={institutionId} kind="program" />
          ) : null}

          {programs.isPending ? (
            <Skeleton className="h-24 w-full" data-testid="programs-loading" />
          ) : programs.isError ? (
            <p className="text-muted-foreground text-sm">{t('programs.error')}</p>
          ) : programs.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('programs.empty')}</p>
          ) : (
            <Table data-testid="programs-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('column.code')}</TableHead>
                  <TableHead>{t('column.name')}</TableHead>
                  <TableHead>{t('column.degreeLevel')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.data.map(program => (
                  <TableRow key={program.id}>
                    <TableCell className="font-mono text-xs">{program.code}</TableCell>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell>{t(`degreeLevel.${program.degreeLevel}`)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('courses.title')}</CardTitle>
          <CardDescription>{t('courses.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {can('course:manage') ? (
            <CatalogueEntryForm institutionId={institutionId} kind="course" />
          ) : null}

          {courses.isPending ? (
            <Skeleton className="h-24 w-full" data-testid="courses-loading" />
          ) : courses.isError ? (
            <p className="text-muted-foreground text-sm">{t('courses.error')}</p>
          ) : courses.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('courses.empty')}</p>
          ) : (
            <Table data-testid="courses-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('column.code')}</TableHead>
                  <TableHead>{t('column.title')}</TableHead>
                  <TableHead>{t('column.credits')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.data.map(course => (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono text-xs">{course.code}</TableCell>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.credits ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
