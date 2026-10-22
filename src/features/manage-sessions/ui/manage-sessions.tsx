'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { apiQueries, toApiError } from '@/shared/api';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ListSkeleton,
  QueryError,
} from '@/shared/ui';

import { sessionQueries } from '../model/queries';
import { SessionItem } from './session-item';

export function ManageSessions() {
  const t = useTranslations('accountSettings.sessions');
  const queryClient = useQueryClient();
  const query = useQuery(sessionQueries.mine());

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: sessionQueries.mineKey() });
  const fail = (error: unknown) => toast.error(toApiError(error).message);

  const revokeOne = useMutation({
    ...apiQueries.revokeMySessionMutation(),
    onSuccess: async () => {
      toast.success(t('signedOut'));
      await refresh();
    },
    onError: fail,
  });

  const revokeOthers = useMutation({
    ...apiQueries.revokeMyOtherSessionsMutation(),
    onSuccess: async () => {
      toast.success(t('signedOutOthers'));
      await refresh();
    },
    onError: fail,
  });

  const sessions = query.data ?? [];
  const others = sessions.filter(session => !session.current).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {query.isPending ? <ListSkeleton /> : null}
        {query.isError ? (
          <QueryError
            title={t('errorTitle')}
            onRetry={() => {
              void query.refetch();
            }}
          />
        ) : null}

        {sessions.length > 0 ? (
          <ul className="divide-border divide-y">
            {sessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                revoking={
                  revokeOne.isPending && revokeOne.variables.path.sessionId === session.id
                }
                onRevoke={() => {
                  revokeOne.mutate({ path: { sessionId: session.id } });
                }}
              />
            ))}
          </ul>
        ) : null}

        {others > 0 ? (
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={revokeOthers.isPending}
              onClick={() => {
                revokeOthers.mutate({});
              }}
            >
              {revokeOthers.isPending ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : null}
              {t('signOutOthers')}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
