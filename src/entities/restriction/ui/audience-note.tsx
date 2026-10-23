'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/ui';

import type { AudienceView } from '../model/restriction';

export function AudienceNote({
  audience,
  viewer,
}: {
  audience: AudienceView;
  viewer: 'author' | 'student';
}) {
  const t = useTranslations('restriction.audience');
  const names = audience.groups
    .map(group => (group.missing ? t('missing') : (group.groupName ?? '')))
    .join(', ');

  if (viewer === 'student') return <p>{t('only', { names })}</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="w-fit">
        <Users aria-hidden="true" />
        {t('badge', { names })}
      </Badge>
      <span>{t(audience.hideFromOthers ? 'hidden' : 'locked')}</span>
    </div>
  );
}
