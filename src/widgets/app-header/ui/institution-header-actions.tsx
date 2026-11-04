'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { notificationQueries } from '@/entities/notification';
import { usePermissions } from '@/entities/permission';
import { institutionRoutes, Link, usePathname, useRouter } from '@/shared/config';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { institutionIdIn } from '../model/institution-path';

/**
 * Search and notifications are tools, not places, so inside an institution
 * they sit in the header on every screen instead of taking two sidebar rows.
 * The header is shared by the whole app, so the institution is read from the
 * address; outside one, this renders nothing.
 */
export function InstitutionHeaderActions() {
  const pathname = usePathname();
  const institutionId = institutionIdIn(pathname);

  if (institutionId === undefined) return null;
  return <Actions institutionId={institutionId} pathname={pathname} />;
}

function Actions({
  institutionId,
  pathname,
}: {
  institutionId: string;
  pathname: string;
}) {
  const t = useTranslations('nav');
  const router = useRouter();
  const routes = institutionRoutes(institutionId);
  const { can } = usePermissions(institutionId);
  const searchable = can('institution:read');
  const notified = can('notification:read');

  const unread = useQuery({
    ...notificationQueries.unreadCount({ path: { institutionId } }),
    enabled: notified,
    refetchInterval: 60_000,
  });
  const count = unread.data?.unreadCount ?? 0;
  const onNotifications = pathname.startsWith(routes.notifications);

  useEffect(() => {
    if (!searchable) return;
    const open = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        router.push(routes.search);
      }
    };
    window.addEventListener('keydown', open);
    return () => {
      window.removeEventListener('keydown', open);
    };
  }, [router, routes.search, searchable]);

  return (
    <>
      {searchable ? (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="text-muted-foreground w-9 justify-start px-0 sm:w-56 sm:px-3"
        >
          <Link href={routes.search} aria-label={t('openSearch')}>
            <Search aria-hidden className="mx-auto sm:mx-0" />
            <span className="hidden flex-1 text-left font-normal sm:inline">
              {t('searchPlaceholder')}
            </span>
            <kbd className="bg-muted hidden rounded px-1.5 font-sans text-[10px] font-medium sm:inline">
              ⌘K
            </kbd>
          </Link>
        </Button>
      ) : null}

      {notified ? (
        <Button
          asChild
          variant="ghost"
          size="icon"
          className={cn('relative', onNotifications && 'bg-accent text-foreground')}
        >
          <Link
            href={routes.notifications}
            aria-current={onNotifications ? 'page' : undefined}
            aria-label={
              count === 0 ? t('notifications') : t('notificationsUnread', { count })
            }
          >
            <Bell aria-hidden fill={onNotifications ? 'currentColor' : 'none'} />
            {count === 0 ? null : (
              <span
                aria-hidden
                className="bg-primary text-primary-foreground animate-fade absolute top-1 right-1 grid min-w-4 place-items-center rounded-full px-1 text-[10px] leading-4 font-semibold tabular-nums"
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>
        </Button>
      ) : null}
    </>
  );
}
