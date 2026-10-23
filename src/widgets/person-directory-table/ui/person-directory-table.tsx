'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { usePermissions } from '@/entities/permission';
import { personQueries } from '@/entities/person';
import {
  Badge,
  EmptyState,
  LoadMore,
  QueryError,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@/shared/ui';

import { ErasePersonCell } from './erase-person-cell';
import { PersonRoleBadges } from './person-role-badges';

/**
 * The endpoint defaults to 20, which is eight presses of *Load more* for an
 * institution of 164; 100 is the server's ceiling and more table than anybody
 * reads at once. Fifty is about two screens.
 */
const PAGE = 50;

export function PersonDirectoryTable({ institutionId }: { institutionId: string }) {
  const t = useTranslations('people');
  const { can } = usePermissions(institutionId);
  const mayErase = can('institution:manage');
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    personQueries.infinite({ path: { institutionId }, query: { limit: PAGE } }),
  );

  const people = data?.pages.flatMap(page => page.items) ?? [];

  if (isPending) return <TableSkeleton rows={5} data-testid="people-loading" />;

  if (isError) {
    return (
      <QueryError
        onRetry={refetch}
        title={t('errorTitle')}
        description={t('errorDescription')}
      />
    );
  }

  if (people.length === 0) return <EmptyState size="inline" title={t('empty')} />;

  return (
    <div className="flex flex-col gap-2">
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
          {people.map(person => (
            <TableRow key={person.userId}>
              <TableCell className="font-medium">{person.displayName}</TableCell>
              <TableCell label={t('email')} wide>
                {person.email}
              </TableCell>
              <TableCell label={t('statusColumn')}>
                <Badge variant={person.status === 'active' ? 'success' : 'secondary'}>
                  {t(`status.${person.status}`)}
                </Badge>
              </TableCell>
              <TableCell label={t('roles')}>
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

      <LoadMore
        shown={people.length}
        hasMore={hasNextPage}
        pending={isFetchingNextPage}
        onLoadMore={() => void fetchNextPage()}
      />
    </div>
  );
}
