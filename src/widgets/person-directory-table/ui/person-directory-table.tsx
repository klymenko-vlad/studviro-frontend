'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { usePermissions } from '@/entities/permission';
import { personQueries } from '@/entities/person';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

import { ErasePersonCell } from './erase-person-cell';
import { PersonRoleBadges } from './person-role-badges';

export function PersonDirectoryTable({ institutionId }: { institutionId: string }) {
  const t = useTranslations('people');
  const { can } = usePermissions(institutionId);
  const mayErase = can('institution:manage');
  const { data, isPending, isError } = useQuery(
    personQueries.listForInstitution({ path: { institutionId } }),
  );

  if (isPending) return <Skeleton className="h-24 w-full" data-testid="people-loading" />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>{t('errorDescription')}</AlertDescription>
      </Alert>
    );
  }

  if (data.length === 0)
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;

  return (
    <Table label={t('title')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('name')}</TableHead>
          <TableHead>{t('email')}</TableHead>
          <TableHead>{t('statusColumn')}</TableHead>
          <TableHead>{t('roles')}</TableHead>
          {mayErase ? (
            <TableHead>
              <span className="sr-only">{t('actions')}</span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(person => (
          <TableRow key={person.userId}>
            <TableCell className="font-medium">{person.displayName}</TableCell>
            <TableCell>{person.email}</TableCell>
            <TableCell>
              <Badge variant={person.status === 'active' ? 'default' : 'secondary'}>
                {t(`status.${person.status}`)}
              </Badge>
            </TableCell>
            <TableCell>
              <PersonRoleBadges roles={person.roles} />
            </TableCell>
            {mayErase ? (
              <TableCell className="text-right">
                <ErasePersonCell institutionId={institutionId} person={person} />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
