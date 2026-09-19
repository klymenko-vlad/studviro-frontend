'use client';

import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { RetireRoomButton, RoomForm } from '@/features/manage-rooms';
import { usePermissions } from '@/entities/permission';
import { byBuilding, roomQueries } from '@/entities/room';
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

export function Rooms({ institutionId }: { institutionId: string }) {
  const t = useTranslations('rooms');
  const { can } = usePermissions(institutionId);
  const manageable = can('schedule:manage');

  const rooms = useQuery(roomQueries.list({ path: { institutionId } }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {manageable ? <RoomForm institutionId={institutionId} /> : null}

        {rooms.isPending ? (
          <Skeleton className="h-24 w-full" data-testid="rooms-loading" />
        ) : rooms.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : rooms.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <Table label={t('title')} data-testid="rooms-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t('column.code')}</TableHead>
                <TableHead>{t('column.name')}</TableHead>
                <TableHead>{t('column.capacity')}</TableHead>
                {manageable ? (
                  <TableHead>
                    <span className="sr-only">{t('column.actions')}</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {byBuilding(rooms.data).map(([building, inBuilding]) => (
                <Fragment key={building ?? 'unplaced'}>
                  <TableRow>
                    <TableCell
                      colSpan={manageable ? 4 : 3}
                      className="text-muted-foreground text-xs font-medium uppercase"
                    >
                      {building ?? t('noBuilding')}
                    </TableCell>
                  </TableRow>
                  {inBuilding.map(room => (
                    <TableRow key={room.id}>
                      <TableCell className="font-mono text-xs">{room.code}</TableCell>
                      <TableCell className="font-medium">{room.name ?? '—'}</TableCell>
                      <TableCell>
                        {room.capacity === null
                          ? '—'
                          : t('seats', { count: room.capacity })}
                      </TableCell>
                      {manageable ? (
                        <TableCell className="text-right">
                          <RetireRoomButton
                            institutionId={institutionId}
                            roomId={room.id}
                            roomCode={room.code}
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
