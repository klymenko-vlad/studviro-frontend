'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { EnrollmentButton } from '@/features/request-enrollment';
import {
  actionableOfferings,
  EnrollableOfferingCard,
  enrollableOfferingQueries,
} from '@/entities/enrollable-offering';
import { ListSkeleton, QueryError, Switch } from '@/shared/ui';

export function EnrollableCourses({ institutionId }: { institutionId: string }) {
  const t = useTranslations('enrollment');
  const [actionableOnly, setActionableOnly] = useState(false);
  // Always asked again on arrival: places are taken and freed by other people,
  // and a student sent here by "a place came free" must see it free.
  const { data, isPending, isError, refetch } = useQuery({
    ...enrollableOfferingQueries.list({ path: { institutionId } }),
    staleTime: 0,
  });

  if (isPending)
    return <ListSkeleton items={3} data-testid="enrollable-courses-loading" />;

  if (isError)
    return (
      <QueryError
        onRetry={refetch}
        title={t('errorTitle')}
        description={t('errorDescription')}
      />
    );

  const visible = actionableOnly ? actionableOfferings(data) : data;

  return (
    <div className="flex flex-col gap-6" data-testid="enrollable-courses">
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={actionableOnly} onCheckedChange={setActionableOnly} />
        {t('actionableOnly')}
      </label>

      {visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {data.length === 0 ? t('empty') : t('emptyForFilters')}
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visible.map(offering => (
            <li key={offering.id}>
              <EnrollableOfferingCard
                offering={offering}
                action={
                  <EnrollmentButton institutionId={institutionId} offering={offering} />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
