'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

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

import { PersonRoleBadges } from './person-role-badges';

export function PersonDirectoryTable({ institutionId }: { institutionId: string }) {
  const t = useTranslations('people');
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('name')}</TableHead>
          <TableHead>{t('email')}</TableHead>
          <TableHead>{t('statusColumn')}</TableHead>
          <TableHead>{t('roles')}</TableHead>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
