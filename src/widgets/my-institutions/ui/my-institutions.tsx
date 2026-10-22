'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { institutionQueries } from '@/entities/institution';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ListSkeleton,
} from '@/shared/ui';

import { InstitutionRow } from './institution-row';

export function MyInstitutions() {
  const t = useTranslations('account');
  const { data, isPending } = useQuery(institutionQueries.mine());

  const institutions = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('institutions.title')}</CardTitle>
        <CardDescription>{t('institutions.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        {isPending ? (
          <ListSkeleton items={2} data-testid="my-institutions-loading" />
        ) : null}

        {!isPending && institutions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('institutions.empty')}</p>
        ) : null}

        {institutions.length > 0 ? (
          <ul className="divide-border divide-y">
            {institutions.map(institution => (
              <InstitutionRow key={institution.id} institution={institution} />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
