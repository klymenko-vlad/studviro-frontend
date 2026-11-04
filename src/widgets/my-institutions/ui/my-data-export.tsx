'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { ExportMyData } from '@/features/personal-data';
import { institutionQueries } from '@/entities/institution';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/shared/ui';

/**
 * The export is scoped to one institution's record of the person, not to the
 * whole account, so each institution gets its own download.
 */
export function MyDataExport() {
  const t = useTranslations('account');
  const { data, isPending } = useQuery(institutionQueries.mine());
  const institutions = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dataExport.title')}</CardTitle>
        <CardDescription>{t('dataExport.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        {isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : institutions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('dataExport.empty')}</p>
        ) : (
          <ul className="divide-border flex flex-col divide-y">
            {institutions.map(institution => (
              <li
                key={institution.id}
                className="flex flex-col items-start gap-2 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-medium">{institution.name}</span>
                <ExportMyData institutionId={institution.id} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
