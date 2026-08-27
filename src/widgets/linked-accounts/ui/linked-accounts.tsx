'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { linkedAccountQueries } from '@/entities/linked-account';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/shared/ui';

import { LinkedAccountItem } from './linked-account-item';

export function LinkedAccounts() {
  const t = useTranslations('account');
  const { data, isPending, isError } = useQuery(linkedAccountQueries.mine());

  const accounts = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('linkedAccounts.title')}</CardTitle>
        <CardDescription>{t('linkedAccounts.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        {isPending ? (
          <Skeleton className="h-16 w-full" data-testid="linked-accounts-loading" />
        ) : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t('linkedAccounts.errorTitle')}</AlertTitle>
            <AlertDescription>{t('linkedAccounts.errorDescription')}</AlertDescription>
          </Alert>
        ) : null}

        {!isPending && !isError && accounts.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('linkedAccounts.empty')}</p>
        ) : null}

        {accounts.length > 0 ? (
          <ul className="divide-border divide-y">
            {accounts.map(account => (
              <LinkedAccountItem key={account.id} account={account} />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
