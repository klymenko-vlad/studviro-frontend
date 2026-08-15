import { useFormatter, useTranslations } from 'next-intl';

import { issuerHost, type LinkedAccount } from '@/entities/linked-account';
import { Badge } from '@/shared/ui';

export function LinkedAccountItem({ account }: { account: LinkedAccount }) {
  const t = useTranslations('account');
  const format = useFormatter();

  const lastUsed = account.lastAuthenticatedAt
    ? t('linkedAccounts.lastAuthenticated', {
        date: format.dateTime(new Date(account.lastAuthenticatedAt), {
          dateStyle: 'medium',
        }),
      })
    : t('linkedAccounts.neverUsed');

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="flex flex-col gap-1">
        <span className="font-medium">
          {account.externalUsername ?? issuerHost(account.issuer)}
        </span>
        <span className="text-muted-foreground text-sm">{lastUsed}</span>
      </div>

      <Badge variant="outline">{t(`source.${account.sourceSystem}`)}</Badge>
    </li>
  );
}
