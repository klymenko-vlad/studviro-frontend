'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { apiQueries, toApiError } from '@/shared/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ListSkeleton,
  QueryError,
  Switch,
} from '@/shared/ui';

import {
  isGroupOn,
  NOTIFICATION_MAIL_GROUPS,
  withGroup,
  type NotificationMailGroup,
} from '../model/groups';

export function ManageNotificationMail() {
  const t = useTranslations('accountSettings.notificationMail');
  const queryClient = useQueryClient();
  const preferences = useQuery(apiQueries.getMyNotificationPreferencesOptions());
  const queryKey = apiQueries.getMyNotificationPreferencesQueryKey();

  const save = useMutation({
    ...apiQueries.updateMyNotificationPreferencesMutation(),
    onSuccess: saved => {
      queryClient.setQueryData(queryKey, saved);
      toast.success(t('saved'));
    },
    onError: error => toast.error(toApiError(error).message),
  });

  const chosen = save.isPending
    ? save.variables.body.emailTypes
    : (preferences.data?.emailTypes ?? []);

  const toggle = (group: NotificationMailGroup, on: boolean) => {
    save.mutate({ body: { emailTypes: withGroup(chosen, group, on) } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {preferences.isPending ? (
          <ListSkeleton items={5} />
        ) : preferences.isError ? (
          <QueryError title={t('loadError')} onRetry={() => void preferences.refetch()} />
        ) : (
          <ul className="divide-y">
            {NOTIFICATION_MAIL_GROUPS.map(group => {
              const id = `notification-mail-${group.key}`;

              return (
                <li
                  key={group.key}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="space-y-0.5">
                    <label htmlFor={id} className="text-sm font-medium">
                      {t(`groups.${group.key}.label`)}
                    </label>
                    <p className="text-muted-foreground text-sm">
                      {t(`groups.${group.key}.hint`)}
                    </p>
                  </div>
                  <Switch
                    id={id}
                    checked={isGroupOn(group, chosen)}
                    disabled={save.isPending}
                    onCheckedChange={on => {
                      toggle(group, on);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
